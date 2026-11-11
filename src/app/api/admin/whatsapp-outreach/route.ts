import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { verifyAdminRequest } from '@/lib/admin/auth';
import { normalizeTrPhone } from '@/lib/whatsappOutreach';

function verifyAuth(request: Request): boolean {
  return verifyAdminRequest(request);
}

const PAGE = 1000; // PostgREST varsayılan üst sınırı; sayfa sayfa okunur.
const MAX_PHONES = 2000;

type Row = {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  district: string | null;
  phone: string | null;
  email: string | null;
  instagram_url: string | null;
  is_verified: boolean;
  verification_invited_at: string | null;
  whatsapp_invited_at: string | null;
  whatsapp_invite_count: number | null;
  whatsapp_replied_at: string | null;
};

const COLS =
  'id, name, slug, city, district, phone, email, instagram_url, is_verified, verification_invited_at, whatsapp_invited_at, whatsapp_invite_count, whatsapp_replied_at';

/** Kampanya bitiş metni; email.ts'deki sendVerificationInvite mantığıyla senkron. */
function campaignDateText(): string | null {
  const raw = process.env.CAMPAIGN_FEATURED_UNTIL ?? '2027-01-01T00:00:00+03:00';
  if (raw.toLowerCase() === 'off') return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) return null;
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Istanbul',
  });
}

/** Onaylı + görünür + kaldırılmamış tüm profiller (1000'lik sayfalarla). */
async function fetchAll(): Promise<{ rows: Row[]; error?: string }> {
  const supabase = getServiceClient();
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('professionals')
      .select(COLS)
      .in('status', ['approved', 'featured'])
      .eq('is_visible', true)
      .is('removed_at', null)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) return { rows, error: error.message };
    rows.push(...((data ?? []) as Row[]));
    if (!data || data.length < PAGE) break;
  }
  return { rows };
}

/* ── GET: tüm onaylı terapistler + kanal durumu ───────────────────────── */
export async function GET(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { rows, error } = await fetchAll();
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ list: rows, campaignDateText: campaignDateText() });
}

/* ── POST ─────────────────────────────────────────────────────────────────
 * { action: 'sent', id }                  WhatsApp daveti gönderildi (sayaç +1)
 * { action: 'unsent', id }                WhatsApp işaretini geri al
 * { action: 'replied', id, value }        dönüş yaptı / geri al
 * { action: 'bulk', phones, kind, date?, dryRun? }
 *      kind 'sent'    : numaraları "WhatsApp gönderildi" işaretle (zaten işaretliye dokunmaz)
 *      kind 'replied' : numaraları "dönüş yaptı" işaretle (gönderildi yoksa onu da atar)
 *      dryRun true ise yazmaz, yalnızca eşleşme önizlemesi döner.
 * ───────────────────────────────────────────────────────────────────────── */
export async function POST(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const supabase = getServiceClient();
  const action = String(body.action ?? '');

  if (action === 'sent' || action === 'unsent' || action === 'replied') {
    const id = String(body.id ?? '');
    if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 });

    if (action === 'sent') {
      const { data: cur, error: e1 } = await supabase
        .from('professionals')
        .select('whatsapp_invite_count, whatsapp_invited_at')
        .eq('id', id)
        .maybeSingle();
      if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });
      if (!cur) return NextResponse.json({ error: 'Kayıt bulunamadı' }, { status: 404 });
      const patch = {
        whatsapp_invited_at: cur.whatsapp_invited_at ?? new Date().toISOString(),
        whatsapp_invite_count: (cur.whatsapp_invite_count ?? 0) + 1,
      };
      const { error } = await supabase.from('professionals').update(patch).eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, ...patch });
    }

    if (action === 'unsent') {
      const patch = { whatsapp_invited_at: null, whatsapp_invite_count: 0, whatsapp_replied_at: null };
      const { error } = await supabase.from('professionals').update(patch).eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, ...patch });
    }

    // replied
    const value = body.value !== false;
    const patch = { whatsapp_replied_at: value ? new Date().toISOString() : null };
    const { error } = await supabase.from('professionals').update(patch).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, ...patch });
  }

  if (action === 'bulk') {
    const kind = body.kind === 'replied' ? 'replied' : 'sent';
    const dryRun = body.dryRun === true;
    const rawPhones: unknown = body.phones;
    if (!Array.isArray(rawPhones) || rawPhones.length === 0 || rawPhones.length > MAX_PHONES) {
      return NextResponse.json({ error: `1-${MAX_PHONES} arası numara gönderin.` }, { status: 400 });
    }
    let stamp = new Date().toISOString();
    if (body.date) {
      const d = new Date(String(body.date));
      if (Number.isNaN(d.getTime()) || d.getTime() > Date.now() + 86_400_000) {
        return NextResponse.json({ error: 'Geçersiz tarih.' }, { status: 400 });
      }
      stamp = d.toISOString();
    }

    const wanted = new Map<string, string>(); // normalize → girilen metin
    const invalid: string[] = [];
    for (const p of rawPhones) {
      const s = String(p ?? '').trim();
      if (!s) continue;
      const n = normalizeTrPhone(s);
      if (n) wanted.set(n, s);
      else invalid.push(s);
    }

    const { rows, error } = await fetchAll();
    if (error) return NextResponse.json({ error }, { status: 500 });

    // Aynı numarayı paylaşan birden fazla profil olabilir; hepsi eşleşir.
    const byPhone = new Map<string, Row[]>();
    for (const r of rows) {
      const n = normalizeTrPhone(r.phone);
      if (!n) continue;
      const arr = byPhone.get(n) ?? [];
      arr.push(r);
      byPhone.set(n, arr);
    }
    const matched: Row[] = [];
    const unmatched: string[] = [];
    wanted.forEach((orig, n) => {
      const hit = byPhone.get(n);
      if (hit) matched.push(...hit);
      else unmatched.push(orig);
    });

    const preview = matched.map((r) => ({
      id: r.id,
      name: r.name,
      city: r.city,
      alreadyInvited: !!r.whatsapp_invited_at,
      alreadyReplied: !!r.whatsapp_replied_at,
    }));

    if (dryRun) {
      return NextResponse.json({ dryRun: true, matched: preview, unmatched, invalid });
    }

    const ids = matched.map((r) => r.id);
    let updated = 0;
    for (let i = 0; i < ids.length; i += 200) {
      const chunk = ids.slice(i, i + 200);
      // Henüz işaretlenmemişlere gönderim damgası (işaretli olana dokunulmaz).
      const { error: e1 } = await supabase
        .from('professionals')
        .update({ whatsapp_invited_at: stamp, whatsapp_invite_count: 1 })
        .in('id', chunk)
        .is('whatsapp_invited_at', null);
      if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });
      if (kind === 'replied') {
        const { error: e2 } = await supabase
          .from('professionals')
          .update({ whatsapp_replied_at: stamp })
          .in('id', chunk)
          .is('whatsapp_replied_at', null);
        if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
      }
      updated += chunk.length;
    }
    return NextResponse.json({ ok: true, updated, matched: preview, unmatched, invalid });
  }

  return NextResponse.json({ error: 'Bilinmeyen işlem.' }, { status: 400 });
}
