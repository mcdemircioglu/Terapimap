import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { PANEL_FEATURES } from '@/lib/panel/features';
import { calculateProfileCompleteness } from '@/lib/panel/profileCompleteness';
import { ProfileCompletenessCard } from '@/components/panel/ProfileCompletenessCard';
import { LeadsSummaryCard } from '@/components/panel/LeadsSummaryCard';

/**
 * /panel — Genel Bakış.
 * Auth kontrolü üst katmandaki (app)/layout.tsx'te yapılıyor; burada
 * yalnızca içerik için gereken profil verisini çekiyoruz.
 */
export default async function PanelOverviewPage() {
  const supabase = getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Savunma amaçlı: layout zaten yönlendirir, ama tip güvenliği için.
  if (!user) redirect('/panel/giris');

  const { data: professional } = await supabase
    .from('professionals')
    .select(
      `id, name, city, status, is_verified, title, district, about, image_url,
       phone, price_range, experience_years, is_online, is_in_person,
       website_url, instagram_url`,
    )
    .eq('user_id', user.id)
    .maybeSingle();

  if (!professional) {
    return (
      <Card className="p-6">
        <h1 className="mb-2 text-lg font-semibold text-brand-900">
          Profil bulunamadı
        </h1>
        <p className="text-sm text-brand-600">
          Hesabınıza bağlı bir terapist profili bulunamadı. Lütfen Terapimap
          ekibiyle iletişime geçin.
        </p>
      </Card>
    );
  }

  const { count: specialtyCount } = await supabase
    .from('professional_specialties')
    .select('specialty_id', { count: 'exact', head: true })
    .eq('professional_id', professional.id);

  const completeness = calculateProfileCompleteness({
    title: professional.title,
    district: professional.district,
    about: professional.about,
    image_url: professional.image_url,
    phone: professional.phone,
    price_range: professional.price_range,
    experience_years: professional.experience_years,
    is_online: professional.is_online,
    is_in_person: professional.is_in_person,
    website_url: professional.website_url,
    instagram_url: professional.instagram_url,
    specialtyCount: specialtyCount ?? 0,
  });

  // RLS zaten yalnızca admin'in onaylayıp gönderdiği kendi taleplerini
  // döner (bkz. supabase/panel_leads_rls.sql).
  const { data: leadsForSummary } = await supabase
    .from('leads')
    .select('id, therapist_contacted_at')
    .eq('professional_id', professional.id);

  const leadsTotal = leadsForSummary?.length ?? 0;
  const leadsPending = leadsForSummary?.filter((l) => !l.therapist_contacted_at).length ?? 0;

  const upcomingModules = [
    { key: 'leads' as const, label: 'Talepler', desc: 'Gelen danışan taleplerini buradan takip edeceksiniz.' },
    { key: 'profile' as const, label: 'Profilim', desc: 'Dizin profilinizi kendiniz güncelleyebileceksiniz.' },
    { key: 'appointments' as const, label: 'Randevular', desc: 'Randevu takviminizi buradan yöneteceksiniz.' },
    { key: 'analytics' as const, label: 'Performans', desc: 'Profilinizin görüntülenme ve dönüşüm verilerini göreceksiniz.' },
  ].filter((m) => !PANEL_FEATURES[m.key]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h1 className="mb-1 text-xl font-semibold text-brand-900">
          Hoş geldiniz, {professional.name}
        </h1>
        <p className="text-sm text-brand-600">
          {professional.city} ·{' '}
          {professional.is_verified ? 'Doğrulanmış profil' : 'Doğrulama bekleniyor'}
        </p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <ProfileCompletenessCard result={completeness} />
        <LeadsSummaryCard total={leadsTotal} pending={leadsPending} />
      </div>

      {upcomingModules.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-400">
            Yakında
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {upcomingModules.map((m) => (
              <Card key={m.key} className="p-5">
                <h3 className="mb-1 text-sm font-semibold text-brand-800">{m.label}</h3>
                <p className="text-sm text-brand-500">{m.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
