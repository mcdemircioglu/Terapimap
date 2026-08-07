import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { sendVerificationInvite } from '@/lib/email';

// Gmail SMTP ile sıralı gönderim uzun sürebilir → süreyi uzat.
export const maxDuration = 60;

const MAX_BATCH = 40;
const DEFAULT_BATCH = 20;

function verifyAuth(request: Request): boolean {
  const pw = request.headers.get('x-admin-password');
  return !!pw && pw === process.env.ADMIN_PASSWORD;
}

/**
 * Outreach hedef filtresi: onaylı + görünür + kaldırılmamış + doğrulanmamış +
 * daveti gönderilmemiş + geçerli görünen e-postası olan profiller.
 * Filtreler tek bir select üzerine uygulanır (çift .select() sayımı bozuyordu).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyPending(q: any) {
  return q
    .in('status', ['approved', 'featured'])
    .eq('is_visible', true)
    .is('removed_at', null)
    .eq('is_verified', false)
    .is('verification_invited_at', null)
    .not('email', 'is', null)
    .neq('email', '')
    .like('email', '%@%');
}

/* ── GET: durum sayıları ──────────────────────────────────────────────── */
export async function GET(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const supabase = getServiceClient();

  const { count: pending, error: pErr } = await applyPending(
    supabase.from('professionals').select('id', { count: 'exact', head: true }),
  );
  const { count: invited, error: iErr } = await supabase
    .from('professionals')
    .select('id', { count: 'exact', head: true })
    .not('verification_invited_at', 'is', null);

  if (pErr || iErr) {
    return NextResponse.json({ error: (pErr ?? iErr)?.message }, { status: 500 });
  }
  return NextResponse.json({ pending: pending ?? 0, invited: invited ?? 0 });
}

/* ── POST: sıradaki grubu gönder ──────────────────────────────────────── */
export async function POST(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  let limit = parseInt(String(body.limit ?? DEFAULT_BATCH), 10) || DEFAULT_BATCH;
  limit = Math.max(1, Math.min(MAX_BATCH, limit));

  const supabase = getServiceClient();

  const { data: rows, error } = await applyPending(
    supabase.from('professionals').select('id, name, email'),
  )
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!rows || rows.length === 0) {
    return NextResponse.json({ sent: 0, failed: 0, remaining: 0, results: [] });
  }

  let sent = 0;
  let failed = 0;
  const results: { name: string; email: string; ok: boolean; error?: string }[] = [];

  for (const p of rows as { id: string; name: string; email: string }[]) {
    try {
      await sendVerificationInvite({ id: p.id, name: p.name, email: p.email });
      // Yalnızca gönderim başarılıysa damgala → çifte gönderim olmaz.
      await supabase
        .from('professionals')
        .update({ verification_invited_at: new Date().toISOString() })
        .eq('id', p.id);
      sent++;
      results.push({ name: p.name, email: p.email, ok: true });
    } catch (e) {
      failed++;
      results.push({
        name: p.name,
        email: p.email,
        ok: false,
        error: e instanceof Error ? e.message : 'bilinmeyen hata',
      });
    }
    // Gmail'i zorlamamak için küçük ara.
    await new Promise((r) => setTimeout(r, 350));
  }

  const { count: remaining } = await applyPending(
    supabase.from('professionals').select('id', { count: 'exact', head: true }),
  );

  return NextResponse.json({ sent, failed, remaining: remaining ?? 0, results });
}
