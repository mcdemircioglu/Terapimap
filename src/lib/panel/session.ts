import { cache } from 'react';
import { getServerClient } from '@/lib/supabase/server';

/**
 * Panel sayfaları için istek başına (request-scoped) önbellekli oturum
 * yardımcıları.
 *
 * Neden: /panel/(app)/layout.tsx ve altındaki sayfa AYNI istekte render edilir
 * ve ikisi de `supabase.auth.getUser()` (Supabase Auth'a ağ çağrısı) ile
 * terapist profilini sorguluyordu. React `cache()` aynı istek içinde aynı
 * argümanlı çağrıları tek seferde çalıştırır (promise paylaşılır), böylece
 * layout + sayfa tek `getUser` ve — aynı kolonlar istendiyse — tek profil
 * sorgusu yapar. İstekler arasında paylaşım YOKTUR; kullanıcı verisi sızmaz.
 *
 * Not: middleware'deki `getUser()` (token yenileme) ayrı bir istek katmanıdır ve
 * bilerek korunur.
 */

/** Layout'un çektiği temel kolonlar; aynı kolonları isteyen sayfa sorguyu paylaşır. */
export const PANEL_BASE_COLUMNS = 'id, name, city, status, is_verified';

export const getPanelUser = cache(async () => {
  const supabase = getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Oturumdaki kullanıcıya bağlı terapist profili. `columns` birebir aynı string
 * ise (ör. PANEL_BASE_COLUMNS) layout ile sayfa sorguyu paylaşır; farklıysa
 * yalnızca o sayfa için ayrı bir sorgu yapılır (kullanıcı çağrısı yine paylaşılır).
 */
export const getPanelProfessional = cache(async (columns: string) => {
  const user = await getPanelUser();
  if (!user) {
    return { user: null, professional: null, error: null } as const;
  }
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from('professionals')
    .select(columns)
    .eq('user_id', user.id)
    .maybeSingle();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { user, professional: (data ?? null) as any, error };
});
