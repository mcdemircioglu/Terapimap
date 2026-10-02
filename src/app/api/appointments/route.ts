import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { computeAvailableSlots } from '@/lib/appointments/slots';
import { addMinutesIso, utcIsoToIstanbulLocal } from '@/lib/appointments/time';
import { sendAppointmentRequestToTherapist, sendAppointmentPendingToClient } from '@/lib/email';

const MIN_LEAD_MINUTES = 120;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/appointments
 * Danışanın profil sayfasındaki widget'tan gönderdiği anında rezervasyon.
 * İstemciden gelen start_at'e güvenmiyoruz — /api/appointments/available-
 * slots ile aynı computeAvailableSlots fonksiyonunu burada da çalıştırıp
 * gönderilen saatin gerçekten hâlâ müsait olduğunu sunucu tarafında
 * yeniden doğruluyoruz (aradaki sürede başka biri aynı saati almış
 * olabilir, ya da terapist müsaitliğini değiştirmiş olabilir).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const professionalId = String(body.professional_id ?? '').trim();
  const startAt = String(body.start_at ?? '').trim();
  const sessionType = String(body.session_type ?? '').trim();
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const phone = body.phone ? String(body.phone).trim() : null;

  if (!professionalId || !startAt || !name || !email) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }
  if (sessionType !== 'online' && sessionType !== 'in_person') {
    return NextResponse.json({ error: 'invalid_session_type' }, { status: 400 });
  }
  if (name.length > 200) {
    return NextResponse.json({ error: 'too_long' }, { status: 400 });
  }
  const startMs = Date.parse(startAt);
  if (Number.isNaN(startMs)) {
    return NextResponse.json({ error: 'invalid_start_at' }, { status: 400 });
  }
  if (startMs < Date.now() + MIN_LEAD_MINUTES * 60_000 - 60_000) {
    // 1 dakikalık tolerans: istek ile sunucu saatleri arasındaki küçük farklar için.
    return NextResponse.json({ error: 'too_soon' }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: professional } = await supabase
    .from('professionals')
    .select(
      'id, name, slug, email, session_duration_minutes, is_online, is_in_person, meeting_link, status, is_visible, removed_at, clinic_name, address, district, city',
    )
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

  if (sessionType === 'online' && (!professional.is_online || !professional.meeting_link)) {
    return NextResponse.json({ error: 'online_not_available' }, { status: 400 });
  }
  if (sessionType === 'in_person' && !professional.is_in_person) {
    return NextResponse.json({ error: 'in_person_not_available' }, { status: 400 });
  }

  // Seçilen saatin hâlâ müsait olduğunu, o günün müsaitlik kurallarını/
  // istisnalarını/mevcut randevularını yeniden çekip doğruluyoruz.
  const { date } = utcIsoToIstanbulLocal(startAt);
  const nowIso = new Date().toISOString();

  const [{ data: rules }, { data: exceptions }, { data: existingAppointments }] = await Promise.all([
    supabase
      .from('availability_rules')
      .select('weekday, start_time, end_time')
      .eq('professional_id', professionalId),
    supabase
      .from('availability_exceptions')
      .select('date, is_closed, start_time, end_time')
      .eq('professional_id', professionalId)
      .eq('date', date),
    supabase
      .from('appointments')
      .select('start_at, end_at')
      .eq('professional_id', professionalId)
      .neq('status', 'cancelled')
      .gte('start_at', nowIso),
  ]);

  const slotsForDay = computeAvailableSlots({
    sessionDurationMinutes: professional.session_duration_minutes,
    rules: rules ?? [],
    exceptions: exceptions ?? [],
    existingAppointments: existingAppointments ?? [],
    fromDate: date,
    days: 1,
    minLeadMinutes: MIN_LEAD_MINUTES,
  });

  const stillAvailable = (slotsForDay[date] ?? []).includes(new Date(startAt).toISOString());
  if (!stillAvailable) {
    return NextResponse.json({ error: 'slot_taken' }, { status: 409 });
  }

  const endAt = addMinutesIso(startAt, professional.session_duration_minutes);
  const meetingLink = sessionType === 'online' ? professional.meeting_link : null;

  const { data: appointment, error: insertError } = await supabase
    .from('appointments')
    .insert({
      professional_id: professionalId,
      client_name: name,
      client_email: email,
      client_phone: phone,
      session_type: sessionType,
      start_at: new Date(startAt).toISOString(),
      end_at: endAt,
      meeting_link: meetingLink,
      status: 'pending',
    })
    .select('id, start_at, end_at, session_type, meeting_link, status')
    .single();

  if (insertError) {
    // Yarış durumunda (iki kişi aynı saati aynı anda seçerse) kısmi unique
    // index bunu engeller — appointments_migration.sql'deki son güvence.
    if ((insertError as any).code === '23505') {
      return NextResponse.json({ error: 'slot_taken' }, { status: 409 });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  try {
    await Promise.all([
      sendAppointmentRequestToTherapist({
        appointment: {
          client_name: name,
          client_email: email,
          client_phone: phone,
          session_type: sessionType,
          start_at: appointment.start_at,
          end_at: appointment.end_at,
          meeting_link: meetingLink,
        },
        professional: {
          name: professional.name,
          email: professional.email,
          clinic_name: professional.clinic_name,
          address: professional.address,
          district: professional.district,
          city: professional.city,
        },
      }),
      sendAppointmentPendingToClient({
        appointment: {
          client_name: name,
          client_email: email,
          session_type: sessionType,
          start_at: appointment.start_at,
          end_at: appointment.end_at,
          meeting_link: meetingLink,
        },
        professional: {
          name: professional.name,
          clinic_name: professional.clinic_name,
          address: professional.address,
          district: professional.district,
          city: professional.city,
        },
      }),
    ]);
  } catch (e) {
    // Randevu zaten kaydedildi; e-posta gönderimindeki bir hata rezervasyonu
    // iptal etmemeli. Sunucu loguna düşsün yeterli.
    console.error('appointment request email failed', e);
  }

  // Admin'in /admin/leads üzerinden "panelden kaç randevu gitti, kime gitti"
  // görebilmesi için bilgilendirme amaçlı bir lead kaydı da düşüyoruz.
  // source: 'randevu_takvimi' ile işaretlenip sent_at/status doğrudan
  // "contacted" olarak set ediliyor — bu zaten admin onayı gerektiren bir
  // talep değil, gerçekleşmiş bir randevunun kaydı; bu yüzden admin'in
  // "Gönder" akışını (terapiste tekrar mail atardı) tetiklemiyor. Terapistin
  // kendi Talepler sekmesinde tekrar görünmemesi için o sayfadaki sorgu bu
  // source değerini ayrıca filtreliyor (zaten Randevularım'da görüyor).
  try {
    const whenLabel = new Date(appointment.start_at).toLocaleString('tr-TR', {
      timeZone: 'Europe/Istanbul',
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
    const typeLabel = sessionType === 'online' ? 'Online görüşme' : 'Yüz yüze görüşme';
    await supabase.from('leads').insert({
      professional_id: professionalId,
      name,
      email,
      phone,
      message: `Danışan, randevu takviminden randevu talebinde bulundu (terapist onayı bekleniyor): ${whenLabel} (${typeLabel}).`,
      source: 'randevu_takvimi',
      status: 'contacted',
      sent_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('appointment lead logging failed', e);
  }

  return NextResponse.json({ ok: true, appointment });
}
