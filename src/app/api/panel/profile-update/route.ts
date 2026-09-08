import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';

/**
 * POST /api/panel/profile-update
 *
 * Terapistin panelden gönderdiği profil düzenleme talebi. Doğrudan
 * professionals tablosuna YAZMAZ — mevcut moderasyon kuyruğuna
 * (therapist_verification_requests, request_type: 'update') ekler.
 * Admin bu talebi /admin/verification-requests ekranından, kamu
 * başvuru formuyla tamamen aynı akıştan onaylar/reddeder.
 *
 * Oturuma bağlı client kullanıyoruz (service-role DEĞİL): hem "kendi
 * profilini bul", hem "bekleyen talebi var mı" kontrolü hem de INSERT
 * tamamen Adım 2/4'te kurulan RLS politikalarıyla doğrulanıyor — bu da
 * bu route'un yalnızca oturum sahibinin kendi profili için talep
 * oluşturabildiğini garantiler.
 */

// professionals kolonu → therapist_verification_requests kolonu
const FIELD_MAP = {
  title: 'title',
  district: 'district',
  clinic_name: 'clinic_name',
  address: 'address',
  google_maps_url: 'google_maps_url',
  website_url: 'website',
  instagram_url: 'instagram',
  about: 'bio',
  is_online: 'offers_online',
  is_in_person: 'offers_in_person',
  image_url: 'photo_url',
} as const;

type EditableField = keyof typeof FIELD_MAP;
const EDITABLE_FIELDS = Object.keys(FIELD_MAP) as EditableField[];

export async function POST(request: Request) {
  const supabase = getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
  }

  const { data: professional, error: profErr } = await supabase
    .from('professionals')
    .select('id, name, email, phone')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profErr || !professional) {
    return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 404 });
  }

  if (!professional.email || !professional.phone) {
    return NextResponse.json(
      {
        error:
          'Profilinizde kayıtlı e-posta veya telefon bulunmuyor. Lütfen Terapimap ekibiyle iletişime geçin.',
      },
      { status: 400 },
    );
  }

  const { data: pending } = await supabase
    .from('therapist_verification_requests')
    .select('id')
    .eq('professional_id', professional.id)
    .eq('request_type', 'update')
    .eq('status', 'pending')
    .maybeSingle();

  if (pending) {
    return NextResponse.json(
      { error: 'Zaten incelenmeyi bekleyen bir güncelleme talebiniz var.' },
      { status: 409 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  const payload: Record<string, unknown> = {
    professional_id: professional.id,
    request_type: 'update',
    full_name: professional.name,
    email: professional.email,
    phone: professional.phone,
    status: 'pending',
  };

  let hasChange = false;
  for (const field of EDITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      const value = body[field];
      if (value !== undefined) {
        payload[FIELD_MAP[field]] = value;
        hasChange = true;
      }
    }
  }

  if (!hasChange) {
    return NextResponse.json({ error: 'Değişiklik bulunamadı.' }, { status: 400 });
  }

  const { data: created, error: insertErr } = await supabase
    .from('therapist_verification_requests')
    .insert(payload)
    .select('id')
    .single();

  if (insertErr || !created) {
    return NextResponse.json(
      { error: 'Talep gönderilemedi: ' + (insertErr?.message ?? 'bilinmeyen hata') },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
