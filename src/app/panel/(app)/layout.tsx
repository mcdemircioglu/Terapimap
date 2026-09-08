import { redirect } from 'next/navigation';
import { getServerClient } from '@/lib/supabase/server';
import { PanelShell } from '@/components/panel/PanelShell';

/**
 * /panel altındaki giriş yapılmış tüm sayfaların ortak kabuğu.
 * (app) bir route group — URL'e "/app" olarak yansımaz, yalnızca
 * giriş/davet/şifre-belirle sayfalarını bu auth-gate'in ve sidebar'ın
 * dışında tutmak için kullanılıyor.
 */
export default async function PanelAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/panel/giris');
  }

  const { data: professional } = await supabase
    .from('professionals')
    .select('id, name, city, status, is_verified')
    .eq('user_id', user.id)
    .maybeSingle();

  return <PanelShell professional={professional}>{children}</PanelShell>;
}
