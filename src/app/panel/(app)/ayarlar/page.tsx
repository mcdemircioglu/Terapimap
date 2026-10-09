import { redirect } from 'next/navigation';
import { getPanelUser } from '@/lib/panel/session';
import { PasswordChangeForm } from '@/components/panel/PasswordChangeForm';

export default async function PanelSettingsPage() {
  const user = await getPanelUser();

  if (!user) redirect('/panel/giris');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-brand-900">Ayarlar</h1>
        <p className="text-sm text-brand-500">Hesap ayarlarınızı buradan yönetin.</p>
      </div>

      <PasswordChangeForm />
    </div>
  );
}
