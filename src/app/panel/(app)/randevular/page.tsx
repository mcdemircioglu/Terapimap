import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { AppointmentsTabs } from '@/components/panel/AppointmentsTabs';
import { CancelAppointmentButton } from '@/components/panel/CancelAppointmentButton';

function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default async function PanelAppointmentsPage() {
  const supabase = getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/panel/giris');

  const { data: professional } = await supabase
    .from('professionals')
    .select('id')
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

  const nowIso = new Date().toISOString();

  const [
    { data: upcoming, error: upcomingError },
    { data: past },
    { count: rulesCountRaw, error: rulesError },
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select('id, client_name, client_email, client_phone, session_type, start_at, end_at, meeting_link, status')
      .eq('professional_id', professional.id)
      .eq('status', 'confirmed')
      .gte('start_at', nowIso)
      .order('start_at', { ascending: true }),
    supabase
      .from('appointments')
      .select('id, client_name, session_type, start_at, status')
      .eq('professional_id', professional.id)
      .or(`status.eq.cancelled,start_at.lt.${nowIso}`)
      .order('start_at', { ascending: false })
      .limit(20),
    supabase
      .from('availability_rules')
      .select('id', { count: 'exact', head: true })
      .eq('professional_id', professional.id),
  ]);

  // appointments/availability_rules tabloları henüz oluşturulmamışsa
  // (migration çalıştırılmamışsa) Postgres "relation does not exist" hatası
  // döner — bunu sessizce yutup boş liste göstermek yerine açıkça bildiriyoruz.
  const dbError = upcomingError ?? rulesError;
  if (dbError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-brand-900">Randevular</h1>
        </div>
        <AppointmentsTabs active="list" />
        <Card className="border-amber-200 bg-amber-50 p-6">
          <h2 className="mb-2 text-lg font-semibold text-brand-900">
            Veritabanı güncellemesi henüz yapılmamış
          </h2>
          <p className="text-sm text-brand-700">
            Randevu sistemi için gereken tablolar veritabanında bulunamadı.
            <code className="mx-1 rounded bg-white px-1.5 py-0.5 text-xs">
              supabase/appointments_migration.sql
            </code>
            dosyasının Supabase → SQL Editor&#39;da çalıştırılması gerekiyor.
          </p>
          <p className="mt-2 text-xs text-brand-400">Teknik detay: {dbError.message}</p>
        </Card>
      </div>
    );
  }

  const hasRules = (rulesCountRaw ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-brand-900">Randevular</h1>
        <p className="text-sm text-brand-500">
          Danışanlarınızın sizden aldığı randevular burada listelenir.
        </p>
      </div>

      <AppointmentsTabs active="list" />

      {!hasRules && (
        <Card className="border-accent-200 bg-accent-50/60 p-5">
          <p className="text-sm text-brand-800">
            Henüz müsaitlik saatlerinizi belirlemediniz — danışanlar sizden randevu
            alamıyor.{' '}
            <a href="/panel/randevular/musaitlik" className="font-medium text-brand-900 underline">
              Müsaitlik Ayarları
            </a>{' '}
            sekmesinden haftalık programınızı ekleyin.
          </p>
        </Card>
      )}

      {!upcoming || upcoming.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-brand-500">Yaklaşan randevunuz yok.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {upcoming.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-brand-900">{fmtDateTime(a.start_at)}</p>
                  <p className="mt-1 text-sm text-brand-700">
                    {a.client_name} ·{' '}
                    <a href={`mailto:${a.client_email}`} className="hover:underline">
                      {a.client_email}
                    </a>
                    {a.client_phone && (
                      <>
                        {' · '}
                        <a href={`tel:${a.client_phone}`} className="hover:underline">
                          {a.client_phone}
                        </a>
                      </>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-brand-500">
                    {a.session_type === 'online' ? 'Online görüşme' : 'Yüz yüze görüşme'}
                    {a.session_type === 'online' && a.meeting_link && (
                      <>
                        {' · '}
                        <a href={a.meeting_link} target="_blank" rel="noopener noreferrer" className="underline">
                          Görüşme linki
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <CancelAppointmentButton appointmentId={a.id} />
              </div>
            </Card>
          ))}
        </div>
      )}

      {past && past.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-brand-700">Geçmiş / İptal Edilen</h2>
          <div className="space-y-2">
            {past.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-brand-100 px-4 py-2.5 text-sm text-brand-500"
              >
                <span>
                  {fmtDateTime(a.start_at)} · {a.client_name}
                </span>
                <span className={a.status === 'cancelled' ? 'text-red-500' : 'text-brand-400'}>
                  {a.status === 'cancelled' ? 'İptal edildi' : 'Tamamlandı'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
