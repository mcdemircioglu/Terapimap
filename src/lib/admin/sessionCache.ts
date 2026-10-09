/**
 * Admin paneli için küçük, tarayıcı oturumuna (sessionStorage) bağlı liste
 * önbelleği.
 *
 * Admin sayfaları arasındaki geçiş düz <a href> ile yapıldığı için sayfa her
 * seferinde baştan yüklenir ve bellekteki state kaybolur. Ağır olan tek istek
 * (terapist listesi + uzmanlıklar) bu yüzden kısa süreliğine sessionStorage'da
 * tutulur; süre dolmadan geri dönüşte yeniden istenmez.
 *
 * - Yalnızca bu sekmede yaşar (sessionStorage), sekme kapanınca silinir.
 * - Süre `ADMIN_CACHE_TTL_MS`; Yenile düğmesi zorla yeniler.
 * - Listede e-posta/telefon yok (bkz. GET /api/admin/professionals); yalnızca
 *   ad, şehir, durum gibi düşük hassasiyetli alanlar saklanır.
 * - Her erişim try/catch içinde: storage kapalı/dolu/bozuksa sessizce atlanır,
 *   sayfa önbelleksiz çalışır.
 * - Liste verisini sunucuda değiştiren sayfalar (başvuru/talep onayı) ilgili
 *   anahtarı `clearAdminCache` ile siler.
 */

const PREFIX = 'terapimap_admin_cache:';

export const ADMIN_CACHE_TTL_MS = 5 * 60 * 1000;
export const CACHE_KEY_PROFESSIONALS = 'professionals';
export const CACHE_KEY_SPECIALTIES = 'specialties';

export type CacheEntry<T> = { ts: number; data: T };

export function readAdminCache<T>(key: string, ttlMs: number = ADMIN_CACHE_TTL_MS): CacheEntry<T> | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (!entry || typeof entry.ts !== 'number' || Date.now() - entry.ts > ttlMs) return null;
    return entry;
  } catch {
    return null;
  }
}

/** `ts` verilirse (yerel güncellemelerde) tazelik süresi uzatılmaz. */
export function writeAdminCache<T>(key: string, data: T, ts: number = Date.now()): void {
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify({ ts, data } satisfies CacheEntry<T>));
  } catch {
    /* storage dolu/kapalı: önbelleksiz devam */
  }
}

/** Anahtar verilmezse tüm admin önbelleği silinir. */
export function clearAdminCache(key?: string): void {
  try {
    if (key) {
      sessionStorage.removeItem(PREFIX + key);
      return;
    }
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(PREFIX)) sessionStorage.removeItem(k);
    }
  } catch {
    /* yok say */
  }
}
