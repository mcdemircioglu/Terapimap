import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { CITIES } from '@/lib/cities';
import { getKnownSeoSlugs } from '@/lib/seo-slugs';
import { locales } from '@/i18n';

export const revalidate = 3600;

const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://terapimap.com').replace(/\/$/, '');

function u(path: string): string {
  return BASE + path;
}

function row(
  localePath: string,
  freq: MetadataRoute.Sitemap[number]['changeFrequency'],
  priority: number,
  lastMod?: Date,
): MetadataRoute.Sitemap[number] {
  return {
    url: u(localePath),
    lastModified: lastMod ?? new Date(),
    changeFrequency: freq,
    priority,
    alternates: {
      languages: Object.fromEntries(
        locales.map((loc) => {
          const withoutLocale = localePath.replace(/^\/[a-z]{2}/, '');
          return [loc, u('/' + loc + withoutLocale)];
        }),
      ),
    },
  };
}

/** Cookie-free Supabase client — safe to use in metadata routes. */
function getStaticClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    { auth: { persistSession: false } },
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getStaticClient();

  const [{ data: therapistsRaw }, { data: specialtiesRaw }] = await Promise.all([
    supabase.from('professionals').select('slug, updated_at'),
    supabase.from('specialties').select('slug'),
  ]);

  const therapists = therapistsRaw ?? [];
  const specialties = specialtiesRaw ?? [];

  const result: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    const l = '/' + locale;

    // Homepages (/tr, /en)
    result.push(row(l, 'daily', 1.0));

    // Therapist listing
    result.push(row(l + '/therapists', 'daily', 0.9));

    // City listing pages — /therapists/{city}
    for (const city of CITIES) {
      result.push(row(l + '/therapists/' + city.slug, 'weekly', 0.8));
    }

    // City + specialty drill-downs — /therapists/{city}/{specialty}
    for (const city of CITIES) {
      for (const sp of specialties) {
        result.push(row(l + '/therapists/' + city.slug + '/' + sp.slug, 'weekly', 0.6));
      }
    }

    // Known SEO slugs — /ankara-psikolog, /online-terapi, etc.
    for (const seoSlug of getKnownSeoSlugs()) {
      result.push(row(l + '/' + seoSlug, 'weekly', 0.8));
    }

    // Specialty SEO landing pages — /emdr, /travma, etc.
    for (const sp of specialties) {
      result.push(row(l + '/' + sp.slug, 'weekly', 0.7));
    }
  }

  // Therapist profile pages — both locales per profile
  for (const t of therapists) {
    const profilePath = '/therapist/' + t.slug;
    const lastMod = t.updated_at ? new Date(t.updated_at) : new Date();
    for (const locale of locales) {
      result.push(row('/' + locale + profilePath, 'monthly', 0.6, lastMod));
    }
  }

  return result;
}
