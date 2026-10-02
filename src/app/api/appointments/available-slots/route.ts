import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { computeAvailableSlots } from '@/lib/appointments/slots';
import { addDays, istanbulToday } from '@/lib/appointments/time';

const DAYS_AHEAD = 21;
const MIN_LEAD_MINUTES = 120;

/**
 * GET /api/appointments/available-slots?professionalId=...
 *
 * Herkese açık uçtur (profil sayfasındaki randevu widget'ı için). Anon
 * kullanıcının availability_rules/exceptions/appointments tablolarına
 * doğrudan erişimi yok (bkz. appointments_migration.sql) — bu yüzden
 * service-role istemcisi kullanılıyor; dışarı yalnızca hesaplanmış boş
 * saat listesi çıkıyor, ham tablo verisi değil.
 */
export async function GET(request: Request) {
  const professionalId = new URL(request.url).searchParams.get('professionalId');
  if (!professionalId) {
    return NextResponse.json({ error: 'missing_professional_id' }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: professional } = await supabase
    .from('professionals')
    .select('id, session_duration_minutes, is_online, is_in_person, meeting_link, status, is_visible, removed_at')
    .eq('id', professionalId)
    .maybeSingle();

  if (
    !professional ||
    !['approved', 'featured'].includes(professional.status) ||
    !professional.is_visible ||
    professional.removed_at
  ) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const fromDate = istanbulToday();
  const toDate = addDays(fromDate, DAYS_AHEAD - 1);
  const nowIso = new Date().toISOString();

  const [{ data: rules }, { data: exceptions }, { data: appointments }] = await Promise.all([
    supabase
      .from('availability_rules')
      .select('weekday, start_time, end_time')
      .eq('professional_id', professionalId),
    supabase
      .from('availability_exceptions')
      .select('date, is_closed, start_time, end_time')
      .eq('professional_id', professionalId)
      .gte('date', fromDate)
      .lte('date', toDate),
    supabase
      .from('appointments')
      .select('start_at, end_at')
      .eq('professional_id', professionalId)
      .eq('status', 'confirmed')
      .gte('start_at', nowIso),
  ]);

  const slots = computeAvailableSlots({
    sessionDurationMinutes: professional.session_duration_minutes,
    rules: rules ?? [],
    exceptions: exceptions ?? [],
    existingAppointments: appointments ?? [],
    fromDate,
    days: DAYS_AHEAD,
    minLeadMinutes: MIN_LEAD_MINUTES,
  });

  return NextResponse.json({
    sessionDurationMinutes: professional.session_duration_minutes,
    isOnline: professional.is_online,
    isInPerson: professional.is_in_person,
    hasMeetingLink: !!professional.meeting_link,
    slots,
  });
}
