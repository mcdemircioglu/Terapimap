import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { ProfileEditForm } from '@/components/panel/ProfileEditForm';

export default async function PanelProfilePage() {
  const supabase = getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/panel/giris');

  const { data: professional } = await supabase
    .from('professionals')
    .select(
      `id, name, city, title, district, clinic_name, address, google_maps_url,
       website_url, instagram_url, about, is_online, is_in_person, image_url`,
    )
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

  const { data: pendingRequest } = await supabase
    .from('therapist_verification_requests')
    .select('id, created_at')
    .eq('professional_id', professional.id)
    .eq('request_type', 'update')
    .eq('status', 'pending')
    .maybeSingle();

  const { data: recentRequests } = await supabase
    .from('therapist_verification_requests')
    .select('id, status, created_at, admin_note')
    .eq('professional_id', professional.id)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-brand-900">Profilim</h1>
        <p className="text-sm text-brand-500">
          Değişiklikleriniz doğrudan yayınlanmaz; Terapimap ekibi onayladıktan sonra
          dizindeki profilinize yansır.
        </p>
      </div>

      <ProfileEditForm
        professional={professional}
        pendingRequest={pendingRequest ?? null}
        recentRequests={recentRequests ?? []}
      />
    </div>
  );
}
