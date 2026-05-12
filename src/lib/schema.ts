import type { ProfessionalWithSpecialties } from '@/types/database';

// ─────────────────────────────────────────────────────────────────────────────
// Base URL
// ─────────────────────────────────────────────────────────────────────────────
const BASE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://terapimap.com').replace(/\/$/, '');

export function absUrl(path: string): string {
  return BASE + path;
}

// ─────────────────────────────────────────────────────────────────────────────
// BreadcrumbList
// ─────────────────────────────────────────────────────────────────────────────
export function buildBreadcrumbSchema(
  items: { name: string; url: string }[],
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Therapist profile — Person + MedicalBusiness composite
// ─────────────────────────────────────────────────────────────────────────────
export function buildTherapistSchema(
  therapist: ProfessionalWithSpecialties,
  locale: string,
) {
  const url = absUrl('/' + locale + '/therapist/' + therapist.slug);
  const specialtyNames = therapist.specialties.map((s) => s.name);

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': ['Person', 'MedicalBusiness'],
    name: therapist.name,
    url,
    address: {
      '@type': 'PostalAddress',
      addressLocality: therapist.city,
      addressCountry: 'TR',
      ...(therapist.district ? { addressRegion: therapist.district } : {}),
    },
    ...(therapist.about ? { description: therapist.about } : {}),
    ...(therapist.title ? { jobTitle: therapist.title } : {}),
    ...(therapist.photo_url ? { image: therapist.photo_url } : {}),
    ...(specialtyNames.length
      ? { knowsAbout: specialtyNames, medicalSpecialty: specialtyNames }
      : {}),
    inLanguage: locale === 'tr' ? 'tr-TR' : 'en-US',
  };

  // aggregateRating only when we have a real rating value
  if (therapist.rating > 0) {
    schema['aggregateRating'] = {
      '@type': 'AggregateRating',
      ratingValue: therapist.rating.toFixed(1),
      bestRating: '5',
      worstRating: '1',
    };
  }

  return schema;
}

// ─────────────────────────────────────────────────────────────────────────────
// CollectionPage — listing + SEO landing pages
// ─────────────────────────────────────────────────────────────────────────────
export function buildCollectionPageSchema({
  name,
  description,
  url,
  locale,
}: {
  name: string;
  description: string;
  url: string;
  locale: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
    inLanguage: locale === 'tr' ? 'tr-TR' : 'en-US',
    publisher: {
      '@type': 'Organization',
      name: 'Terapimap',
      url: BASE,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQPage — specialty landing pages
// ─────────────────────────────────────────────────────────────────────────────
export function buildFaqSchema(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}
