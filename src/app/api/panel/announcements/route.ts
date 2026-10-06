import { NextResponse } from 'next/server';
import { getServerClient, getServiceClient } from '@/lib/supabase/server';
import { validateAnnouncementPayload } from '@/lib/announcements';
import { sendAnnouncementSubmissionNotification } from '@/lib/email';

/**
 * /api/panel/announcements — terapistin kendi duyuruları (etkinlik /
 * eğitim / iş ilanı). articles'taki panel akışıyla birebir aynı desen:
 * terapist yalnızca 'draft' veya 'pending' durumuna geçebilir —
 * 'published' yalnızca admin onayıyla set edilir (bkz. /api/admin/announcements/[id]).
 *
 * "Duyuru Aç" booking_tier='full' olan terapistlere özel (randevu
 * takvimiyle aynı paket şartı) — bu kısıt burada (POST) sunucu
 * tarafında da uygulanıyor, yalnızca UI'da gizlenmiyor.
 */

async function getOwnProfessional(): Promise<{ id: string; booking_tier: string } | null> {
  const authedSupabase = getServerClient();
  const {
    data: { user },
  } = await authedSupabase.auth.getUser();
  if (!user) return null;

  const { data: professional } = await authedSupabase
    .from('professionals')
    .select('id, booking_tier')
    .eq('user_id', user.id)
    .maybeSingle();

  return professional ?? null;
}

/* ── GET: kendi duyurularım (her durumda) ─────────────────────────────── */
export async function GET() {
  const professional = await getOwnProfessional();
  if (!professional) {
    return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 404 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('announcements')
    .select(
      'id, type, title, description, location_text, is_online, time_label, capacity, price_info, image_url, status, admin_note, created_at, updated_at',
    )
    .eq('professional_id', professional.id)
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ announcements: data ?? [], booking_tier: professional.booking_tier });
}

/* ── POST: yeni duyuru oluştur ─────────────────────────────────────────── */
export async function POST(request: Request) {
  const professional = await getOwnProfessional();
  if (!professional) {
    return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 404 });
  }
  if (professional.booking_tier !== 'full') {
    return NextResponse.json(
      { error: 'Bu özellik tam pakete dahildir. Erişim için Terapimap ekibiyle iletişime geçin.' },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 });

  const { error: validationError, data } = validateAnnouncementPayload(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  // action: 'submit' → incelemeye gönder (pending), yoksa taslak olarak kalır.
  const status = body.action === 'submit' ? 'pending' : 'draft';

  const supabase = getServiceClient();
  const { data: created, error } = await supabase
    .from('announcements')
    .insert({ ...data, status, professional_id: professional.id })
    .select('id')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (status === 'pending') {
    const { data: profRow } = await supabase
      .from('professionals')
      .select('name, slug')
      .eq('id', professional.id)
      .maybeSingle();
    try {
      await sendAnnouncementSubmissionNotification({
        announcement: { id: created.id, ...data } as any,
        professional: { name: profRow?.name ?? 'Bilinmeyen terapist', slug: profRow?.slug ?? '' },
      });
    } catch (mailErr) {
      console.error('[panel/announcements] bildirim e-postası gönderilemedi:', mailErr);
    }
  }

  return NextResponse.json({ id: created.id, status }, { status: 201 });
}
