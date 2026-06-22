import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

function verifyAuth(request: Request): boolean {
  const pw = request.headers.get('x-admin-password');
  return !!pw && pw === process.env.ADMIN_PASSWORD;
}

/* ── GET /api/admin/verification-requests/[id] ────────────────────────────── */
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();

  const { data: vr, error: vrErr } = await supabase
    .from('therapist_verification_requests')
    .select('*')
    .eq('id', params.id)
    .single();

  if (vrErr || !vr) {
    return NextResponse.json({ error: 'Talep bulunamadı.' }, { status: 404 });
  }

  let professional = null;
  if (vr.professional_id) {
    const { data: prof } = await supabase
      .from('professionals')
      .select(`*, professional_specialties ( specialties ( id, slug, name ) )`)
      .eq('id', vr.professional_id)
      .maybeSingle();

    if (prof) {
      const { professional_specialties, ...rest } = prof as Record<string, unknown> & { professional_specialties?: { specialties: { id: string; slug: string; name: string } }[] };
      professional = {
        ...rest,
        specialties: (professional_specialties ?? [])
          .map((ps) => ps.specialties)
          .filter(Boolean),
      };
    }
  }

  return NextResponse.json({ verificationRequest: vr, professional });
}

/* ── PATCH /api/admin/verification-requests/[id] ──────────────────────────── */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: Record<string, unknown> = await request.json();
  const { action, admin_note } = body as { action: string; admin_note?: string };

  const supabase = getServiceClient();

  // Fetch the request first
  const { data: vr, error: vrErr } = await supabase
    .from('therapist_verification_requests')
    .select('*')
    .eq('id', params.id)
    .single();

  if (vrErr || !vr) {
    return NextResponse.json({ error: 'Talep bulunamadı.' }, { status: 404 });
  }

  if (action === 'approve') {
    // ── Approve update / photo_update ──
    if (vr.request_type === 'removal') {
      return NextResponse.json({ error: 'Kaldırma talebi için "remove" aksiyonunu kullanın.' }, { status: 400 });
    }

    if (vr.professional_id) {
      const update: Record<string, unknown> = {
        is_verified: true,
        verification_status: 'verified',
        updated_at: new Date().toISOString(),
      };

      // Apply only non-null fields from the request
      if (vr.full_name) update.name = vr.full_name;
      if (vr.title) update.title = vr.title;
      if (vr.city) update.city = vr.city;
      if (vr.district) update.district = vr.district;
      if (vr.clinic_name) update.clinic_name = vr.clinic_name;
      if (vr.address) update.address = vr.address;
      if (vr.website) update.website_url = vr.website;
      if (vr.instagram) update.instagram_url = vr.instagram;
      if (vr.bio) update.about = vr.bio;
      if (vr.photo_url) update.image_url = vr.photo_url;
      if (vr.offers_online !== null && vr.offers_online !== undefined) update.is_online = vr.offers_online;
      if (vr.offers_in_person !== null && vr.offers_in_person !== undefined) update.is_in_person = vr.offers_in_person;

      const { error: profErr } = await supabase
        .from('professionals')
        .update(update)
        .eq('id', vr.professional_id);

      if (profErr) {
        return NextResponse.json({ error: 'Profesyonel güncellenemedi: ' + profErr.message }, { status: 500 });
      }
    }

    const { error: vrUpdateErr } = await supabase
      .from('therapist_verification_requests')
      .update({ status: 'approved', admin_note: admin_note ?? null })
      .eq('id', params.id);

    if (vrUpdateErr) {
      return NextResponse.json({ error: vrUpdateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, action: 'approved' });
  }

  if (action === 'reject') {
    const { error: vrUpdateErr } = await supabase
      .from('therapist_verification_requests')
      .update({ status: 'rejected', admin_note: admin_note ?? null })
      .eq('id', params.id);

    if (vrUpdateErr) {
      return NextResponse.json({ error: vrUpdateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, action: 'rejected' });
  }

  if (action === 'remove') {
    // ── Soft-delete the professional ──
    if (vr.professional_id) {
      const { error: profErr } = await supabase
        .from('professionals')
        .update({
          is_visible: false,
          removed_at: new Date().toISOString(),
          removal_reason: vr.message ?? 'Terapistin talebi üzerine kaldırıldı.',
          updated_at: new Date().toISOString(),
        })
        .eq('id', vr.professional_id);

      if (profErr) {
        return NextResponse.json({ error: 'Profesyonel kaldırılamadı: ' + profErr.message }, { status: 500 });
      }
    }

    const { error: vrUpdateErr } = await supabase
      .from('therapist_verification_requests')
      .update({ status: 'removed', admin_note: admin_note ?? null })
      .eq('id', params.id);

    if (vrUpdateErr) {
      return NextResponse.json({ error: vrUpdateErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, action: 'removed' });
  }

  if (action === 'note') {
    // Just update admin_note
    const { error: noteErr } = await supabase
      .from('therapist_verification_requests')
      .update({ admin_note: admin_note ?? null })
      .eq('id', params.id);

    if (noteErr) {
      return NextResponse.json({ error: noteErr.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, action: 'note' });
  }

  return NextResponse.json({ error: 'Geçersiz aksiyon.' }, { status: 400 });
}
