import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { unstable_setRequestLocale } from 'next-intl/server';
import TherapistListing from '@/components/TherapistListing';
import JsonLd from '@/components/JsonLd';
import SeoLandingHeader from '@/components/seo/SeoLandingHeader';
import SeoLandingSections from '@/components/seo/SeoLandingSections';
import SeoEmptySuggestions from '@/components/seo/SeoEmptySuggestions';
import { getCityName, getCitySlug, isKnownCity } from '@/lib/cities';
import { getSpecialties, getTherapists, getTherapistStats } from '@/lib/queries';
import { getPublishedArticles } from '@/lib/articles';
import { buildCityEmbedUrl } from '@/lib/maps';
import {
  absUrl,
  buildCollectionPageSchema,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildItemListSchema,
} from '@/lib/schema';
import {
  getLandingCopy,
  buildInternalLinks,
  buildSimilarCityLinks,
  buildPageInsightSection,
  buildSpecialtyLinks,
  countBySpecialty,
  lowerKeepAcronyms,
  PILOT_COMBOS,
  specialtyToArticleCategory,
  landingCanonical,
} from '@/lib/seo-landing';
import { brandedTitle, getLocativeSuffix } from '@/lib/utils';

export async function generateMetadataImpl({
  params: { locale, city, specialty },
  searchParams,
}: {
  params: { locale: string; city: string; specialty: string };
  searchParams: { page?: string };
}): Promise<Metadata> {
  const cityName = getCityName(city);
  if (!cityName) return {};
  const specialties = await getSpecialties();
  const s = specialties.find((x) => x.slug === specialty);
  if (!s) return {};

  const stats = await getTherapistStats({ citySlug: city, specialtySlug: specialty });
  const copy = await getLandingCopy({
    citySlug: city,
    cityName,
    specialtySlug: specialty,
    specialtyName: s.name,
    total: stats.total,
    onlineCount: stats.online,
  });

  const page = parseInt(searchParams.page ?? '1', 10) || 1;
  const baseUrl = landingCanonical(locale, city, specialty);
  const title = page > 1 ? `${copy.metaTitle} — Sayfa ${page}` : copy.metaTitle;
  const canonical = page > 1 ? `${baseUrl}?page=${page}` : baseUrl;

  return {
    title: brandedTitle(title),
    description: copy.metaDescription,
    alternates: { canonical },
    robots:
      copy.isIndexable && locale === 'tr' && page === 1
        ? { index: true, follow: true }
        : { index: false, follow: true },
    openGraph: {
      title,
      description: copy.metaDescription,
      url: canonical,
      type: 'website',
      siteName: 'Terapimap',
      locale: locale === 'tr' ? 'tr_TR' : 'en_US',
    },
    twitter: {
      card: 'summary',
      title,
      description: copy.metaDescription,
    },
  };
}

export async function CitySpecialtyPage({
  params,
  searchParams,
}: {
  params: { locale: string; city: string; specialty: string };
  searchParams: {
    online?: string;
    district?: string;
    type?: string;
    inPerson?: string;
    page?: string;
  };
}) {
  unstable_setRequestLocale(params.locale);
  if (!isKnownCity(params.city)) notFound();

  const { locale, city, specialty } = params;
  const cityName = getCityName(city) as string;
  const specialties = await getSpecialties();
  const s = specialties.find((x) => x.slug === specialty);
  if (!s) notFound();
  const specialtyName = s.name;

  // İstatistik + JSON-LD ItemList için ilk terapistler + rehber içerikleri (paralel)
  const [stats, listTherapists, articles, cityTherapists, specialtyTherapists] = await Promise.all([
    getTherapistStats({ citySlug: city, specialtySlug: specialty }),
    getTherapists({ citySlug: city, specialtySlug: specialty, limit: 24 }),
    getPublishedArticles({ category: specialtyToArticleCategory(s), limit: 3 }),
    // İlgili uzmanlık / benzer şehir linklerini gerçek arza göre seçmek için (önbellekli)
    getTherapists({ citySlug: city }),
    getTherapists({ specialtySlug: specialty }),
  ]);

  // Bu uzmanlıkta şehir slug → terapist sayısı
  const specialtyCityCounts: Record<string, number> = {};
  for (const t of specialtyTherapists) {
    const slug = getCitySlug(t.city);
    if (slug) specialtyCityCounts[slug] = (specialtyCityCounts[slug] ?? 0) + 1;
  }

  const copy = await getLandingCopy({
    citySlug: city,
    cityName,
    specialtySlug: specialty,
    specialtyName,
    total: stats.total,
    onlineCount: stats.online,
  });

  // Pilot: seçili kombinasyonlara sayfadaki gerçek veriden "genel bakış" bölümü (ilk bölümün ardına)
  if (PILOT_COMBOS.has(`${city}:${specialty}`)) {
    const insight = buildPageInsightSection({
      cityName,
      citySlug: city,
      specialty: { slug: specialty, name: specialtyName },
      therapists: cityTherapists.filter((t) => t.specialties.some((x) => x.slug === specialty)),
      allSpecialties: specialties,
      citySpecialtyCounts: countBySpecialty(cityTherapists),
      locale,
    });
    if (insight) copy.sections.splice(1, 0, insight);
  }

  const pageUrl = landingCanonical(locale, city, specialty);
  const listBase = locale === 'tr' ? 'terapistler' : 'therapists';
  const homeLabel = locale === 'tr' ? 'Ana Sayfa' : 'Home';
  const listLabel = locale === 'tr' ? 'Terapistler' : 'Therapists';

  const breadcrumbItems = [
    { name: homeLabel, url: absUrl('/' + locale) },
    { name: listLabel, url: absUrl(`/${locale}/${listBase}`) },
    { name: cityName, url: landingCanonical(locale, city) },
    { name: specialtyName, url: pageUrl },
  ];

  const schemas: object[] = [
    buildCollectionPageSchema({
      name: copy.h1,
      description: copy.metaDescription,
      url: pageUrl,
      locale,
    }),
    buildBreadcrumbSchema(breadcrumbItems),
    ...(copy.faqs.length ? [buildFaqSchema(copy.faqs)] : []),
    ...(listTherapists.length
      ? [
          buildItemListSchema({
            therapists: listTherapists,
            locale,
            listUrl: pageUrl,
            cityName,
          }),
        ]
      : []),
  ];

  const internalLinks = buildInternalLinks({
    locale,
    citySlug: city,
    cityName,
    currentSpecialtySlug: specialty,
    specialties,
  });

  const cityLinks = buildSimilarCityLinks({
    locale,
    currentCitySlug: city,
    specialtySlug: specialty,
    specialtyName,
    cityCounts: specialtyCityCounts,
  });
  const specialtyLinks = buildSpecialtyLinks({
    locale,
    citySlug: city,
    cityName,
    currentSpecialtySlug: specialty,
    specialties,
    specialtyCounts: countBySpecialty(cityTherapists),
    limit: 12,
  });
  const mapEmbedUrl = buildCityEmbedUrl(cityName, locale);
  const mapTitle = `${cityName} Haritası`;

  const emptyMessage = `${cityName}${getLocativeSuffix(cityName)} ${lowerKeepAcronyms(specialtyName)} alanında kayıtlı uzman şu anda bulunmuyor. Online çalışan uzmanları inceleyebilir veya aşağıdaki ilgili alanlara göz atabilirsiniz; yeni uzmanlar eklendikçe bu sayfa güncellenir.`;

  return (
    <>
      <JsonLd schema={schemas} />
      <TherapistListing
        locale={locale}
        citySlug={city}
        specialtySlug={specialty}
        searchParams={searchParams}
        headerOverride={
          <SeoLandingHeader
            breadcrumbs={[
              { label: homeLabel, href: `/${locale}` },
              { label: listLabel, href: `/${locale}/${listBase}` },
              { label: cityName, href: `/${locale}/${listBase}/${city}` },
              { label: specialtyName },
            ]}
            h1={copy.h1}
            intro={copy.intro}
            total={stats.total}
            onlineCount={stats.online}
            inPersonCount={stats.inPerson}
            ctaHref={`/${locale}/${listBase}/${city}/${specialty}?online=1`}
            ctaLabel="Online Uzmanları Gör"
          />
        }
        belowResults={
          <SeoLandingSections
            locale={locale}
            copy={copy}
            mapEmbedUrl={mapEmbedUrl}
            mapTitle={mapTitle}
            articles={articles}
            cityLinks={cityLinks}
            specialtyLinks={specialtyLinks}
          />
        }
        emptyExtra={
          <SeoEmptySuggestions message={emptyMessage} links={internalLinks} />
        }
      />
    </>
  );
}
