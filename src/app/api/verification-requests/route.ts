import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const BUCKET = 'therapist-photos';

/* ── POST /api/verification-requests ──────────────────────────────────────── */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  // ── Required field validation ──
  const { professional_id, request_type, full_name, email, phone } = body as Record<string, string>;

  if (!professional_id) {
    return NextResponse.json({ error: 'Terapist ID zorunludur.' }, { status: 400 });
  }
  if (!request_type || !['update', 'photo_update', 'removal'].includes(request_type)) {
    return NextResponse.json({ error: 'Geçerli bir talep tipi seçiniz.' }, { status: 400 });
  }
  if (!full_name?.trim()) {
    return NextResponse.json({ error: 'Ad Soyad zorunludur.' }, { status: 400 });
  }
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Geçerli bir e-posta adresi giriniz.' }, { status: 400 });
  }
  if (!phone?.trim()) {
    return NextResponse.json({ error: 'Telefon numarası zorunludur.' }, { status: 400 });
  }
  if (request_type === 'removal' && !((body.message as string)?.trim())) {
    return NextResponse.json({ error: 'Profil kaldırma talebinde ek açıklama zorunludur.' }, { status: 400 });
  }

  const supabase = getServiceClient();

  // ── Duplicate check: same professional_id + email, pending in last 24h ──
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabase
    .from('therapist_verification_requests')
    .select('id')
    .eq('professional_id', professional_id)
    .eq('email', email.trim().toLowerCase())
    .eq('status', 'pending')
    .gte('created_at', cutoff)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'Bu terapist için son 24 saat içinde zaten bir talep gönderilmiş. Lütfen daha sonra tekrar deneyin.' },
      { status: 429 },
    );
  }

  // ── Build insert payload ──
  const payload: Record<string, unknown> = {
    professional_id,
    request_type,
    full_name: full_name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    status: 'pending',
  };

  const optionalFields = [
    'title', 'city', 'district', 'clinic_name', 'address',
    'website', 'instagram', 'bio', 'message', 'photo_url',
    'offers_online', 'offers_in_person', 'specialties',
  ];
  for (const f of optionalFields) {
    if (body[f] !== undefined && body[f] !== null && body[f] !== '') {
      payload[f] = body[f];
    }
  }

  const { data, error } = await supabase
    .from('therapist_verification_requests')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('[verification-requests] insert error:', error);
    return NextResponse.json({ error: 'Talep kaydedilemedi. Lütfen tekrar deneyin.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
