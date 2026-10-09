import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { createReview } from '@/lib/queries';

import { isRateLimited, tooManyRequests, isHoneypotTripped, fakeOk, JSON_LIMIT, UPLOAD_LIMIT } from '@/lib/spamGuard';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_COMMENT_LENGTH = 2000;
const MIN_COMMENT_LENGTH = 10;

/* ── POST /api/reviews ─────────────────────────────────────────────────────
 * Herkese açık değerlendirme gönderimi. Yorum her zaman 'pending' olarak
 * kaydedilir — admin /admin/reviews üzerinden onaylamadan (leads ve
 * therapist_verification_requests ile aynı moderasyon deseni) public
 * tarafta görünmez.
 *
 * "Doğrulanmış Danışan" rozeti: gönderen e-posta, bu terapiste ait
 * status='confirmed' bir randevunun client_email'iyle eşleşiyorsa
 * otomatik işaretlenir (bkz. appointments_migration.sql).
 * ────────────────────────────────────────────────────────────────────── */
export async function POST(request: Request) {
  if (isRateLimited(request, 'reviews', JSON_LIMIT.limit, JSON_LIMIT.windowMs)) return tooManyRequests();
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // Honeypot: botlara sessiz sahte başarı.
  if (isHoneypotTripped(body)) return fakeOk();

  const professional_id = String(body?.professional_id ?? '').trim();
  const reviewer_name = String(body?.name ?? '').trim();
  const reviewer_email = String(body?.email ?? '').trim().toLowerCase();
  const is_anonymous = body?.is_anonymous === true;
  const rating = Number(body?.rating);
  const comment = String(body?.comment ?? '').trim();

  if (!professional_id || !reviewer_name || !reviewer_email || !comment) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }
  if (!EMAIL_RE.test(reviewer_email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'invalid_rating' }, { status: 400 });
  }
  if (comment.length < MIN_COMMENT_LENGTH || comment.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json({ error: 'invalid_comment_length' }, { status: 400 });
  }
  if (reviewer_name.length > 200) {
    return NextResponse.json({ error: 'too_long' }, { status: 400 });
  }

  const supabase = getServiceClient();

  // ── Aynı danışan + terapist için 24 saat içinde bekleyen bir talep varsa
  //    engelle (leads/verification-requests ile aynı spam koruması). ──
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('professional_id', professional_id)
    .eq('reviewer_email', reviewer_email)
    .eq('status', 'pending')
    .gte('created_at', cutoff)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'duplicate', detail: 'Bu terapist için son 24 saat içinde zaten bir değerlendirme gönderdiniz.' },
      { status: 429 },
    );
  }

  // ── Doğrulanmış danışan kontrolü ──
  const { data: appointment } = await supabase
    .from('appointments')
    .select('id')
    .eq('professional_id', professional_id)
    .eq('client_email', reviewer_email)
    .eq('status', 'confirmed')
    .limit(1)
    .maybeSingle();

  const is_verified = !!appointment;

  try {
    await createReview({
      professional_id,
      reviewer_name,
      reviewer_email,
      is_anonymous,
      rating,
      comment,
      is_verified,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'server_error', detail: e?.message ?? null },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
