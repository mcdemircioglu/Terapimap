import type { MetadataRoute } from 'next';

const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://terapimap.com').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // General crawlers: allow all public pages.
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',            // API routes
          '/admin',           // admin panel
          '/admin/',
          '/_next/',          // Next.js internals
          '/login',           // giriş sayfaları (ileride eklenirse)
          '/verify',          // doğrulama akışları
          '/dogrulama',       // doğrulama (tr)
          '/profil-dogrula/', // terapist profil doğrulama formu
          '/leads',           // lead yönetimi
          // Filtre query-string'leri: /therapists rotaları bu parametreleri
          // okuduğu an dinamik (önbelleksiz) render'a düşüyor. Her kombinasyon
          // ayrı bir crawl = ayrı bir Supabase sorgusu demek; bunları tarattırmak
          // hem Vercel CPU hem Supabase egress'ini gereksiz şişiriyor. Canonical
          // zaten bu parametreler olmadan base sayfayı gösteriyor, indekslenen
          // içerik kaybolmaz.
          '/*?*online=',
          '/*?*inPerson=',
          '/*?*type=',
          '/*?*district=',
          '/*?*q=',
        ],
      },
    ],
    sitemap: BASE + '/sitemap.xml',
    host: BASE,
  };
}
