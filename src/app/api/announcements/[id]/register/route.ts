import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

import { isRateLimited, tooManyRequests, isHoneypotTripped, fakeOk, JSON_LIMIT, UPLOAD_LIMIT } from '@/lib/spamGuard';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Params = { params: { id: string } };

/* ── POST /api/announcements/[id]/register ────────────────────────────
 * Public "Kayıt Ol" formu — leads'teki admin onay akışının AKSİNE hiçbir
 * moderasyon yok: satır doğrudan ilgili terapistin panelindeki
 * "Duyurularım" bölümünde görünür hale gelir (bkz. announcements_migration.sql
 * ve /api/panel/announcements/[id]/registrations). Ödeme/işlem burada
 * yapılmıyor — Terapimap yalnızca duyuruyu yayınlayan taraf.
 * ────────────────────────────────────────────────────────────────────── */
export async function POST(request: Request, { params }: Params) {
  if (isRateLimited(request, 'ann-register', JSON_LIMIT.limit, JSON_LIMIT.windowMs)) return tooManyRequests();
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 });
  }

  // Honeypot: botlara sessiz sahte başarı.
  if (isHoneypotTripped(body)) return fakeOk();

  const name = String(body?.name ?? '').trim();
  const email = String(body?.email ?? '').trim();
  const phone = body?.phone ? String(body.phone).trim() : null;
  const message = body?.message ? String(body.message).trim() : null;

  if (!name || !email) {
    return NextResponse.json({ error: 'Ad soyad ve e-posta zorunludur.' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Geçerli bir e-posta adresi girin.' }, { status: 400 });
  }
  if (name.length > 200 || (message && message.length > 2000) || (phone && phone.length > 50)) {
    return NextResponse.json({ error: 'Girilen bilgiler çok uzun.' }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Yalnızca gerçekten yayında olan bir duyuruya kayıt alınabilir.
  const { data: announcement, error: fetchErr } = await supabase
    .from('announcements')
    .select('id, professional_id, status')
    .eq('id', params.id)
    .maybeSingle();

  if (fetchErr || !announcement || announcement.status !== 'published') {
    return NextResponse.json({ error: 'Bu duyuru için kayıt alınamıyor.' }, { status: 404 });
  }

  const { error } = await supabase.from('announcement_registrations').insert({
    announcement_id: announcement.id,
    professional_id: announcement.professional_id,
    name,
    email,
    phone,
    message,
  });

  if (error) {
    return NextResponse.json({ error: 'Kayıt gönderilemedi. Lütfen tekrar deneyin.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
