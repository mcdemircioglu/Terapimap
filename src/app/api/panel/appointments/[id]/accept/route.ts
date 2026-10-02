import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';
import { sendAppointmentConfirmedToClient } from '@/lib/email';

/**
 * POST /api/panel/appointments/[id]/accept
 * Terapistin onay bekleyen ("pending") bir randevu talebini onaylaması.
 * Sadece pending → confirmed geçişine izin verir (zaten iptal edilmiş
 * veya daha önce onaylanmış bir kayda tekrar uygulanamaz). Mevcut
 * "status/cancelled_at" kolon izniyle aynı RLS politikasını kullanıyor
 * (appointments_migration.sql) — status='confirmed' bu granted kolonlardan
 * biri olduğu için ayrı bir politika gerekmiyor.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .update({ status: 'confirmed' })
    .eq('id', params.id)
    .eq('status', 'pending')
    .select('id, client_name, client_email, session_type, start_at, end_at, meeting_link, professional_id')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!appointment) {
    return NextResponse.json({ error: 'not_found_or_already_handled' }, { status: 404 });
  }

  try {
    const { data: professional } = await supabase
      .from('professionals')
      .select('name, clinic_name, address, district, city')
      .eq('id', appointment.professional_id)
      .maybeSingle();

    await sendAppointmentConfirmedToClient({
      appointment: {
        client_name: appointment.client_name,
        client_email: appointment.client_email,
        session_type: appointment.session_type,
        start_at: appointment.start_at,
        end_at: appointment.end_at,
        meeting_link: appointment.meeting_link,
      },
      professional: {
        name: professional?.name ?? '',
        clinic_name: professional?.clinic_name ?? null,
        address: professional?.address ?? null,
        district: professional?.district ?? null,
        city: professional?.city ?? null,
      },
    });
  } catch (e) {
    console.error('appointment confirmed email failed', e);
  }

  return NextResponse.json({ ok: true });
}
