import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/supabase/server';
import { getPanelProfessional } from '@/lib/panel/session';
import { Card } from '@/components/ui/Card';
import { AppointmentsTabs } from '@/components/panel/AppointmentsTabs';
import { AvailabilityForm } from '@/components/panel/AvailabilityForm';

export default async function PanelAvailabilityPage() {
  const supabase = getServerClient();
  const { user, professional, error: professionalError } = await getPanelProfessional(
    'id, meeting_link, session_duration_minutes, is_online, is_in_person',
  );

  if (!user) redirect('/panel/giris');

  // Yeni kolonlar (meeting_link, session_duration_minutes) henüz eklenmemişse
  // Postgres "column does not exist" hatası döner ve professional null olur —
  // bu durumu "profil bulunamadı" ile karıştırmayıp ayrı, anlaşılır bir mesaj
  // gösteriyoruz (supabase/appointments_migration.sql çalıştırılmamış demektir).
  if (professionalError) {
    return (
      <Card className="border-amber-200 bg-amber-50 p-6">
        <h1 className="mb-2 text-lg font-semibold text-brand-900">
          Veritabanı güncellemesi henüz yapılmamış
        </h1>
        <p className="text-sm text-brand-700">
          Randevu sistemi için gereken tablolar/kolonlar veritabanında bulunamadı.
          <code className="mx-1 rounded bg-white px-1.5 py-0.5 text-xs">
            supabase/appointments_migration.sql
          </code>
          dosyasının Supabase → SQL Editor&#39;da çalıştırılması gerekiyor.
        </p>
        <p className="mt-2 text-xs text-brand-400">Teknik detay: {professionalError.message}</p>
      </Card>
    );
  }

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
