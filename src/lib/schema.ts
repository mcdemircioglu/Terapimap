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
  const url = absUrl('/' + locale + '/psikolog/' + therapist.slug);
  const specialtyNames = therapist.specialties.map((s) => s.name);

  const sameAs = [therapist.website_url, therapist.instagram_url].filter(
    (u): u is string => typeof u === 'string' && u.trim() !== '',
  );

  const availableService = [
    ...(therapist.is_online
      ? [{ '@type': 'MedicalTherapy', name: 'Online Terapi', serviceType: 'online' }]
      : []),
    ...(therapist.is_in_person
      ? [{ '@type': 'MedicalTherapy', name: 'Yüz Yüze Terapi', serviceType: 'in_person' }]
      : []),
  ];

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
    areaServed: {
      '@type': 'City',
      name: therapist.city,
    },
    ...(therapist.about ? { description: therapist.about } : {}),
    ...(therapist.title ? { jobTitle: therapist.title } : {}),
    ...(therapist.image_url ? { image: therapist.image_url } : {}),
    ...(specialtyNames.length
      ? { knowsAbout: specialtyNames, medicalSpecialty: specialtyNames }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(availableService.length ? { availableService } : {}),
    inLanguage: locale === 'tr' ? 'tr-TR' : 'en-US',
  };

  return schema;
}

// ─────────────────────────────────────────────────────────────────────────────
// ItemList — listing sayfalarındaki terapistler
// ─────────────────────────────────────────────────────────────────────────────
export function buildItemListSchema({
  therapists,
  locale,
  listUrl,
  cityName,
}: {
  therapists: ProfessionalWithSpecialties[];
  locale: string;
  listUrl: string;
  cityName?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    url: listUrl,
    numberOfItems: therapists.length,
    itemListElement: therapists.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Person',
        name: t.name,
        url: absUrl('/' + locale + '/psikolog/' + t.slug),
        ...(t.title ? { jobTitle: t.title } : {}),
        ...(t.image_url ? { image: t.image_url } : {}),
        ...(cityName || t.city
          ? { areaServed: { '@type': 'City', name: cityName ?? t.city } }
          : {}),
        ...(t.specialties.length
          ? { knowsAbout: t.specialties.map((s) => s.name) }
          : {}),
      },
    })),
  };
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
