import { NextResponse } from 'next/server';
import { getServerClient, getServiceClient } from '@/lib/supabase/server';
import { validateAnnouncementPayload } from '@/lib/announcements';
import { sendAnnouncementSubmissionNotification } from '@/lib/email';

type Params = { params: { id: string } };

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

/* ── GET: tek duyuru (düzenleme formu için, yalnızca kendi duyurusu) ──── */
export async function GET(request: Request, { params }: Params) {
  const professional = await getOwnProfessional();
  if (!professional) {
    return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 404 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', params.id)
    .eq('professional_id', professional.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Duyuru bulunamadı.' }, { status: 404 });
  return NextResponse.json({ announcement: data });
}

/* ── PUT: güncelle (yalnızca kendi duyurusu)
 * Durum geçişi:
 *  - Mevcut durum 'published' ise → düzenleme ANINDA yayına yansır,
 *    status 'published' kalır (blog ile aynı ürün kararı).
 *  - Mevcut durum 'draft'/'pending'/'rejected' ise → action='submit'
 *    gönderilirse 'pending'e geçer (admin'e mail gider), yoksa 'draft'ta kalır.
 * ─────────────────────────────────────────────────────────────────── */
export async function PUT(request: Request, { params }: Params) {
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

  const supabase = getServiceClient();
  const { data: existing, error: fetchErr } = await supabase
    .from('announcements')
    .select('id, status, professional_id')
    .eq('id', params.id)
    .maybeSingle();

  if (fetchErr || !existing || existing.professional_id !== professional.id) {
    return NextResponse.json({ error: 'Duyuru bulunamadı.' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 });

  const { error: validationError, data } = validateAnnouncementPayload(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const wasPublished = existing.status === 'published';
  const wasPending = existing.status === 'pending';
  const status = wasPublished ? 'published' : body.action === 'submit' ? 'pending' : 'draft';
  // Reddedilmiş bir duyuru tekrar gönderilince eski red notu artık geçersiz.
  const admin_note = status === 'pending' ? null : undefined;

  const updatePayload: Record<string, unknown> = { ...data, status };
  if (admin_note !== undefined) updatePayload.admin_note = admin_note;

  const { error: updateErr } = await supabase
    .from('announcements')
    .update(updatePayload)
    .eq('id', params.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 400 });
  }

  // Yeniden incelemeye gönderildiyse (ilk kez pending olan hariç tutmuyoruz —
  // draft/rejected'tan pending'e her geçişte admin'e haber verilir).
  if (status === 'pending' && !wasPending) {
    const { data: profRow } = await supabase
      .from('professionals')
      .select('name, slug')
      .eq('id', professional.id)
      .maybeSingle();
    try {
      await sendAnnouncementSubmissionNotification({
        announcement: { id: params.id, ...data } as any,
        professional: { name: profRow?.name ?? 'Bilinmeyen terapist', slug: profRow?.slug ?? '' },
      });
    } catch (mailErr) {
      console.error('[panel/announcements] bildirim e-postası gönderilemedi:', mailErr);
    }
  }

  return NextResponse.json({ ok: true, status });
}

/* ── DELETE: yalnızca yayınlanmamış kendi duyurusu silinebilir ───────── */
export async function DELETE(request: Request, { params }: Params) {
  const professional = await getOwnProfessional();
  if (!professional) {
    return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 404 });
  }

  const supabase = getServiceClient();
  const { data: existing, error: fetchErr } = await supabase
    .from('announcements')
    .select('id, status, professional_id')
    .eq('id', params.id)
    .maybeSingle();

  if (fetchErr || !existing || existing.professional_id !== professional.id) {
    return NextResponse.json({ error: 'Duyuru bulunamadı.' }, { status: 404 });
  }

  if (existing.status === 'published') {
    return NextResponse.json(
      { error: 'Yayındaki bir duyuruyu kaldırmak için Terapimap ekibiyle iletişime geçin.' },
      { status: 400 },
    );
  }

  const { error: deleteErr } = await supabase.from('announcements').delete().eq('id', params.id);
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
