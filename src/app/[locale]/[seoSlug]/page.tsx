import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { unstable_setRequestLocale } from 'next-intl/server';
import Container from '@/components/Container';
import TherapistGrid from '@/components/TherapistGrid';
import JsonLd from '@/components/JsonLd';
import {
  parseSeoSlug,
  getKnownSeoSlugs,
  getCityProfTypeContent,
  getOnlineContent,
  getSpecialtyContent,
  PROF_TYPE_SLUG_MAP,
  PROF_TYPE_TR,
} from '@/lib/seo-slugs';
import { getTherapists, getSpecialtyBySlug } from '@/lib/queries';
import { CITIES } from '@/lib/cities';
import {
  absUrl,
  buildCollectionPageSchema,
  buildBreadcrumbSchema,
  buildFaqSchema,
} from '@/lib/schema';

// ─────────────────────────────────────────────────────────────────────────────
// Static params
// ─────────────────────────────────────────────────────────────────────────────
export function generateStaticParams() {
  return getKnownSeoSlugs().map((seoSlug) => ({ seoSlug }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params: { locale, seoSlug },
}: {
  params: { locale: string; seoSlug: string };
}): Promise<Metadata> {
  const page = parseSeoSlug(seoSlug);
  if (!page) return {};

  const url = absUrl('/' + locale + '/' + seoSlug);
  const altLocale = locale === 'tr' ? 'en' : 'tr';

  let title: string;
  let description: string;

  if (page.kind === 'city-proftype') {
    const c = getCityProfTypeContent(page.cityName, page.profType, locale);
    title = c.metaTitle;
    description = c.metaDesc;
  } else if (page.kind === 'online') {
    const c = getOnlineContent(locale);
    title = c.metaTitle;
    description = c.metaDesc;
  } else {
    const specialty = await getSpecialtyBySlug(page.specialtySlug);
    if (!specialty) return {};
    const c = getSpecialtyContent(specialty.name, locale);
    title = c.metaTitle;
    description = c.metaDesc;
  }

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        [locale]: url,
        [altLocale]: absUrl('/' + altLocale + '/' + seoSlug),
      },
    },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      locale: locale === 'tr' ? 'tr_TR' : 'en_US',
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
export default async function SeoLandingPage({
  params: { locale, seoSlug },
}: {
  params: { locale: string; seoSlug: string };
}) {
  unstable_setRequestLocale(locale);

  const page = parseSeoSlug(seoSlug);
  if (!page) notFound();

  type Content = { h1: string; intro: string; metaDesc: string; faqs: { q: string; a: string }[] };

  let content: Content;
  let therapists: Awaited<ReturnType<typeof getTherapists>>;
  let relatedLinks: { href: string; label: string }[] = [];

  if (page.kind === 'city-proftype') {
    content = getCityProfTypeContent(page.cityName, page.profType, locale);
    therapists = await getTherapists({
      citySlug: page.citySlug,
      professionalType: page.profType,
    });

    const otherCities = CITIES.filter((c) => c.slug !== page.citySlug);
    const ptSlug = Object.entries(PROF_TYPE_SLUG_MAP).find(([, v]) => v === page.profType)?.[0];
    if (ptSlug) {
      relatedLinks = [
        ...otherCities.map((c) => ({
          href: '/' + locale + '/' + c.slug + '-' + ptSlug,
          label: c.name + ' ' + PROF_TYPE_TR[page.profType],
        })),
        {
          href: '/' + locale + '/online-terapi',
          label: locale === 'tr' ? 'Online Terapi' : 'Online Therapy',
        },
        {
          href: '/' + locale + '/therapists/' + page.citySlug,
          label:
            locale === 'tr'
              ? page.cityName + "'daki tum terapistler"
              : 'All therapists in ' + page.cityName,
        },
      ];
    }
  } else if (page.kind === 'online') {
    content = getOnlineContent(locale);
    therapists = await getTherapists({ online: true });

    relatedLinks = CITIES.map((c) => ({
      href: '/' + locale + '/therapists/' + c.slug,
      label: locale === 'tr' ? c.name + ' terapistleri' : 'Therapists in ' + c.name,
    }));
  } else {
    const specialty = await getSpecialtyBySlug(page.specialtySlug);
    if (!specialty) notFound();

    content = getSpecialtyContent(specialty.name, locale);
    therapists = await getTherapists({ specialtySlug: specialty.slug });

    relatedLinks = [
      {
        href: '/' + locale + '/therapists',
        label: locale === 'tr' ? 'Tum terapistler' : 'All therapists',
      },
      ...CITIES.map((c) => ({
        href: '/' + locale + '/therapists/' + c.slug + '/' + specialty.slug,
        label:
          locale === 'tr'
            ? c.name + ' — ' + specialty.name
            : specialty.name + ' in ' + c.name,
      })),
    ];
  }

  const pageUrl = absUrl('/' + locale + '/' + seoSlug);
  const countLabel =
    locale === 'tr'
      ? therapists.length + ' uzman bulundu'
      : therapists.length + ' specialist' + (therapists.length !== 1 ? 's' : '') + ' found';

  // ── Breadcrumb labels ────────────────────────────────────────────────────
  const homeLabel = locale === 'tr' ? 'Ana Sayfa' : 'Home';
  const allLabel = locale === 'tr' ? 'Terapistler' : 'Therapists';

  // ── JSON-LD schemas ──────────────────────────────────────────────────────
  const schemas: object[] = [
    buildCollectionPageSchema({
      name: content.h1,
      description: content.metaDesc,
      url: pageUrl,
      locale,
    }),
    buildBreadcrumbSchema([
      { name: homeLabel, url: absUrl('/' + locale) },
      { name: allLabel, url: absUrl('/' + locale + '/therapists') },
      { name: content.h1, url: pageUrl },
    ]),
  ];

  // FAQPage schema for all page types (all have faqs)
  if (content.faqs.length > 0) {
    schemas.push(buildFaqSchema(content.faqs));
  }

  return (
    <>
      <JsonLd schema={schemas} />

      {/* ── Hero ── */}
      <section className="border-b border-brand-100 bg-gradient-to-b from-brand-50 to-white">
        <Container className="py-10 md:py-16">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold leading-tight text-brand-950 sm:text-3xl md:text-4xl">
              {content.h1}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-brand-700 md:mt-4 md:text-base">
              {content.intro}
            </p>
          </div>
        </Container>
      </section>

      {/* ── Professionals grid ── */}
      <section>
        <Container className="py-10 md:py-14">
          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-sm text-brand-600">{countLabel}</p>
            <Link
              href={'/' + locale + '/therapists'}
              className="text-sm font-medium text-brand-700 hover:text-brand-900"
            >
              {locale === 'tr' ? 'Tumunu gor' : 'View all'} &rarr;
            </Link>
          </div>

          {therapists.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-12 text-center text-brand-600">
              {locale === 'tr'
                ? 'Bu kriterlere uyan terapist bulunamadi.'
                : 'No therapists matched these filters.'}
            </div>
          ) : (
            <TherapistGrid therapists={therapists} locale={locale} />
          )}
        </Container>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-brand-50/40">
        <Container className="py-10 md:py-14">
          <h2 className="text-xl font-semibold text-brand-900 md:text-2xl">
            {locale === 'tr' ? 'Sikca Sorulan Sorular' : 'Frequently Asked Questions'}
          </h2>
          <dl className="mt-6 divide-y divide-brand-100">
            {content.faqs.map((faq, i) => (
              <details key={i} className="group py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-semibold text-brand-900 hover:text-brand-700">
                  <span>{faq.q}</span>
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex-shrink-0 text-brand-400 transition-transform duration-200 group-open:rotate-45"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                      <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-brand-700">{faq.a}</p>
              </details>
            ))}
          </dl>
        </Container>
      </section>

      {/* ── Related links ── */}
      {relatedLinks.length > 0 && (
        <section>
          <Container className="py-10 md:py-14">
            <h2 className="text-base font-semibold text-brand-900">
              {locale === 'tr' ? 'Ilgili Sayfalar' : 'Related Pages'}
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {relatedLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-block rounded-full border border-brand-200 bg-white px-3.5 py-1.5 text-sm text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}
    </>
  );
}
