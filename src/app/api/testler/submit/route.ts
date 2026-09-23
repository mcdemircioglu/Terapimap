import { NextResponse } from 'next/server';
import { getTestBySlug, createTestSubmission } from '@/lib/queries';
import { sendTestResultEmail } from '@/lib/email';

// Basic email check; mirrors src/app/api/leads/route.ts.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const testSlug = String(body?.testSlug ?? '').trim();
  const score = Number(body?.score);
  const email = body?.email ? String(body.email).trim() : null;
  const consentMarketing = Boolean(body?.consentMarketing);

  if (!testSlug || !Number.isFinite(score) || score < 0) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }
  // Sonuç zaten client-side hesaplanıp gösterildi — bu uç nokta yalnızca
  // e-posta ile paylaşılmak istenen (opt-in) sonuçlar için çağrılır.
  if (!email) {
    return NextResponse.json({ error: 'missing_email' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }
  if (!consentMarketing) {
    return NextResponse.json({ error: 'consent_required' }, { status: 400 });
  }

  const test = await getTestBySlug(testSlug);
  if (!test) {
    return NextResponse.json({ error: 'test_not_found' }, { status: 404 });
  }

  const tier = test.scoring.tiers.find((t) => score >= t.min && score <= t.max);
  if (!tier) {
    return NextResponse.json({ error: 'invalid_score' }, { status: 400 });
  }

  try {
    await createTestSubmission({
      test_id: test.id,
      score,
      tier_label: tier.label_tr,
      email,
      consent_marketing: consentMarketing,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'server_error', detail: e?.message ?? null },
      { status: 500 },
    );
  }

  try {
    await sendTestResultEmail({
      email,
      testTitle: test.title_tr,
      score,
      maxScore: test.scoring.max_score,
      tierLabel: tier.label_tr,
      tierSummary: tier.summary_tr,
      specialtySlug: test.specialty?.slug ?? null,
      specialtyName: test.specialty?.name ?? null,
    });
  } catch (e) {
    // Kayıt zaten yazıldı — mail gönderimi başarısız olsa da kullanıcıya
    // hata dönmeyelim, sadece logla.
    console.error('[terapimap:testler/submit] sendTestResultEmail failed:', e);
  }

  return NextResponse.json({ ok: true });
}
