import { redirect } from 'next/navigation';
import { getPanelProfessional, PANEL_BASE_COLUMNS } from '@/lib/panel/session';
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
  // Kullanıcı + temel profil istek başına tek sefer çekilir; aynı kolonları
  // isteyen sayfalar (randevular, talepler) bu sorguyu paylaşır.
  const { user, professional } = await getPanelProfessional(PANEL_BASE_COLUMNS);

  if (!user) {
    redirect('/panel/giris');
  }

  return <PanelShell professional={professional}>{children}</PanelShell>;
}
