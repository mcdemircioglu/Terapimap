import { getRequestConfig } from 'next-intl/server';

export const locales = ['tr'] as const;
export const defaultLocale = 'tr' as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  // next-intl v3.22+: locale artık `requestLocale` (Promise) üzerinden gelir.
  const requested = await requestLocale;
  // Geçersiz/boş locale'de varsayılana düş (geçersiz locale 404'ü zaten
  // [locale]/layout.tsx içindeki notFound() hallediyor).
  const locale = locales.includes(requested as Locale)
    ? (requested as Locale)
    : defaultLocale;

  return {
    // locale'i DÖNDÜRMEK zorunlu — yoksa next-intl "none was returned" uyarısı
    // basar ve v4'te hata olur.
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
