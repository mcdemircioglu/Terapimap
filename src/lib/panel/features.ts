/**
 * Panel modülleri için basit feature-flag konfigürasyonu.
 *
 * Ağır bir feature-flag servisi yerine düz bir obje: henüz kodu yazılmamış
 * modülleri sidebar'da "Yakında" olarak gösterip linklemeden önlemek için
 * yeterli. Bir modülün kodu bittiğinde burada `true` yapılır.
 */
export type PanelFeatureKey =
  | 'overview'
  | 'profile'
  | 'leads'
  | 'blog'
  | 'appointments'
  | 'miniSite'
  | 'analytics'
  | 'settings';

export const PANEL_FEATURES: Record<PanelFeatureKey, boolean> = {
  overview: true, // Adım 3
  profile: true, // Adım 4
  leads: true, // Adım 6
  settings: true, // Adım 8
  blog: true, // Faz 1 — Blog Yazılarım
  appointments: false, // Faz 2
  miniSite: false, // Faz 4
  analytics: false, // Faz 2/3
};

export type PanelNavItem = {
  key: PanelFeatureKey;
  label: string;
  href: string;
  icon: 'home' | 'user' | 'inbox' | 'calendar' | 'globe' | 'chart' | 'settings' | 'pen';
};

export const PANEL_NAV_ITEMS: PanelNavItem[] = [
  { key: 'overview', label: 'Genel Bakış', href: '/panel', icon: 'home' },
  { key: 'leads', label: 'Talepler', href: '/panel/talepler', icon: 'inbox' },
  { key: 'profile', label: 'Profilim', href: '/panel/profil', icon: 'user' },
  { key: 'blog', label: 'Blog Yazılarım', href: '/panel/blog', icon: 'pen' },
  { key: 'appointments', label: 'Randevular', href: '/panel/randevular', icon: 'calendar' },
  { key: 'analytics', label: 'Performans', href: '/panel/performans', icon: 'chart' },
  { key: 'miniSite', label: 'Web Sitem', href: '/panel/site', icon: 'globe' },
  { key: 'settings', label: 'Ayarlar', href: '/panel/ayarlar', icon: 'settings' },
];
