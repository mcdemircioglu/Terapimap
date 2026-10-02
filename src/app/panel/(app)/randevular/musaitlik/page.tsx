import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { AppointmentsTabs } from '@/components/panel/AppointmentsTabs';
import { AvailabilityForm } from '@/components/panel/AvailabilityForm';

export default async function PanelAvailabilityPage() {
  const supabase = getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/panel/giris');

  const { data: professional } = await supabase
    .from('professionals')
    .select('id, meeting_link, session_duration_minutes, is_online, is_in_person')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!professional) {
    return (
      <Card className="p-6">
        <h1 className="mb-2 text-lg font-semibold text-brand-900">Profil bulunamadı</h1>
        <p className="text-sm text-brand-600">
          Hesabınıza bağlı bir terapist profili bulunamadı. Lütfen Terapimap ekibiyle
          iletişime geçin.
        </p>
      </Card>
    );
  }

  const [{ data: rules }, { data: exceptions }] = await Promise.all([
    supabase
      .from('availability_rules')
      .select('id, weekday, start_time, end_time')
      .eq('professional_id', professional.id),
    supabase
      .from('availability_exceptions')
      .select('id, date, note')
      .eq('professional_id', professional.id)
      .eq('is_closed', true)
      .gte('date', new Date().toISOString().slice(0, 10))
      .order('date', { ascending: true }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-brand-900">Randevular</h1>
        <p className="text-sm text-brand-500">
          Danışanların sizden hangi gün ve saatlerde randevu alabileceğini buradan
          belirleyin.
        </p>
      </div>

      <AppointmentsTabs active="availability" />

      <AvailabilityForm
        professionalId={professional.id}
        initialMeetingLink={professional.meeting_link ?? ''}
        initialSessionDuration={professional.session_duration_minutes ?? 50}
        isOnline={professional.is_online}
        isInPerson={professional.is_in_person}
        initialRules={rules ?? []}
        initialExceptions={exceptions ?? []}
      />
    </div>
  );
}
