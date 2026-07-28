import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { sendApplicationNotification } from '@/lib/email';

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

  const isNewApplication = request_type === 'new';

  if (!request_type || !['new', 'update', 'photo_update', 'removal'].includes(request_type)) {
    return NextResponse.json({ error: 'Geçerli bir talep tipi seçiniz.' }, { status: 400 });
  }
  // Yeni başvuru dışındaki talepler mevcut bir profile bağlanmalı.
  if (!isNewApplication && !professional_id) {
    return NextResponse.json({ error: 'Terapist ID zorunludur.' }, { status: 400 });
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

  // ── Yeni başvuru için ek zorunlu alanlar ──
  if (isNewApplication) {
    const req = (label: string, v: unknown) =>
      typeof v === 'string' && v.trim() !== ''
        ? null
        : NextResponse.json({ error: `${label} zorunludur.` }, { status: 400 });
    const missing =
      req('Şehir', body.city) ??
      req('İlçe', body.district) ??
      req('Unvan', body.title) ??
      req('Hakkında', body.bio);
    if (missing) return missing;
    const specs = body.specialties;
    if (!Array.isArray(specs) || specs.length === 0) {
      return NextResponse.json(
        { error: 'En az bir uzmanlık alanı seçmelisiniz.' },
        { status: 400 },
      );
    }
  }

  const supabase = getServiceClient();

  // ── Duplicate check: son 24 saatte aynı e-posta + tip, bekleyen talep ──
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let dupQuery = supabase
    .from('therapist_verification_requests')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .eq('request_type', request_type)
    .eq('status', 'pending')
    .gte('created_at', cutoff);
  dupQuery = isNewApplication
    ? dupQuery.is('professional_id', null)
    : dupQuery.eq('professional_id', professional_id);
  const { data: existing } = await dupQuery.maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: 'Bu terapist için son 24 saat içinde zaten bir talep gönderilmiş. Lütfen daha sonra tekrar deneyin.' },
      { status: 429 },
    );
  }

  // ── Build insert payload ──
  const payload: Record<string, unknown> = {
    professional_id: isNewApplication ? null : professional_id,
    request_type,
    full_name: full_name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    status: 'pending',
  };

  const optionalFields = [
    'title', 'city', 'district', 'clinic_name', 'address',
    'website', 'instagram', 'google_maps_url', 'bio', 'message', 'photo_url',
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

  // ── Yeni başvurularda admin'e bildirim e-postası gönder ──
  // E-posta hatası başvuruyu bozmasın: sadece logla, kullanıcıya başarı dön.
  if (isNewApplication) {
    try {
      await sendApplicationNotification({
        fullName: full_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        title: (body.title as string)?.trim() ?? '',
        city: (body.city as string)?.trim() ?? '',
        district: (body.district as string)?.trim() ?? '',
        bio: (body.bio as string)?.trim() ?? '',
        specialties: Array.isArray(body.specialties)
          ? (body.specialties as unknown[]).filter((s): s is string => typeof s === 'string')
          : [],
        website: (body.website as string) ?? null,
        instagram: (body.instagram as string) ?? null,
        googleMapsUrl: (body.google_maps_url as string) ?? null,
        clinicName: (body.clinic_name as string) ?? null,
        offersOnline: body.offers_online === true,
        offersInPerson: body.offers_in_person === true,
      });
    } catch (mailErr) {
      console.error('[verification-requests] bildirim e-postası gönderilemedi:', mailErr);
    }
  }

  return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
}
