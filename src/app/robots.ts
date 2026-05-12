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
          '/api/',      // API routes
          '/admin/',    // admin panel (if added later)
          '/_next/',    // Next.js internals
        ],
      },
    ],
    sitemap: BASE + '/sitemap.xml',
    host: BASE,
  };
}
