import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import TherapistListing from '@/components/TherapistListing';
import JsonLd from '@/components/JsonLd';
import SeoLandingHeader from '@/components/seo/SeoLandingHeader';
import SeoLandingSections from '@/components/seo/SeoLandingSections';
import { CITIES, getCityName, isKnownCity } from '@/lib/cities';
import { getDistricts, getSpecialties, getTherapists, getTherapistStats } from '@/lib/queries';
import { getFeaturedArticles } from '@/lib/articles';
import { buildCityEmbedUrl } from '@/lib/maps';
import {
  absUrl,
  buildCollectionPageSchema,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildItemListSchema,
} from '@/lib/schema';
import {
  buildInternalLinks,
  buildCityLandingCopy,
  buildSimilarCityLinks,
  buildSpecialtyLinks,
  landingCanonical,
} from '@/lib/seo-landing';
import { findBySlug, getLocativeSuffix } from '@/lib/utils';
import SeoEmptySuggestions from '@/components/seo/SeoEmptySuggestions';

export function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({
  params: { locale, city },
  searchParams,
}: {
  params: { locale: string; city: string };
  searchParams: { page?: string; district?: string };
}): Promise<Metadata> {
  const cityName = getCityName(city);
  if (!cityName) return {};
  const t = await getTranslations({ locale, namespace: 'list' });
  const page = parseInt(searchParams.page ?? '1', 10) || 1;
  const baseUrl = landingCanonical(locale, city);

  // District slug → display name
  let districtName: string | undefined;
  if (searchParams.district) {
    const districts = await getDistricts(city);
    districtName = findBySlug(districts, searchParams.district);
  }

  const baseTitle = districtName
    ? `${cityName} ${districtName} Terapistleri | Terapimap`
    : `${cityName} Terapistleri ve Psikologları | Terapimap`;
  const title = page > 1 ? `${baseTitle} — Sayfa ${page}` : baseTitle;

  const place = districtName ? `${cityName} ${districtName}` : cityName;
  const description =
    locale === 'tr'
      ? `${place}${getLocativeSuffix(place, true)} psikolog, klinik psikolog ve psikiyatristleri inceleyin. Uzmanlık alanı ve görüşme türüne göre filtreleyin, size uygun uzmanı seçin.`
      : `Discover verified psychologists, clinical psychologists and psychiatrists in ${place}. Filter by specialty, session type and more.`;

  const qs = new URLSearchParams();
  if (searchParams.district) qs.set('district', searchParams.district);
  if (page > 1) qs.set('page', String(page));
  const canonical = qs.toString() ? `${baseUrl}?${qs}` : baseUrl;

  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: locale === 'tr', follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      siteName: 'Terapimap',
      locale: locale === 'tr' ? 'tr_TR' : 'en_US',
    },
    twitter: {
      card: 'summary',
      title: t('titleCity', { city: cityName }),
      description,
    },
  };
}

export default async function CityPage({
  params,
  searchParams,
}: {
  params: { locale: string; city: string };
  searchParams: {
    online?: string;
    specialty?: string;
    district?: string;
    type?: string;
    inPerson?: string;
    page?: string;
  };
}) {
  unstable_setRequestLocale(params.locale);
  if (!isKnownCity(params.city)) notFound();

  const { locale, city } = params;
  const cityName = getCityName(city) as string;
  const pageUrl = landingCanonical(locale, city);
  const listBase = locale === 'tr' ? 'terapistler' : 'therapists';
  const homeLabel = locale === 'tr' ? 'Ana Sayfa' : 'Home';
  const listLabel = locale === 'tr' ? 'Terapistler' : 'Therapists';

  const [stats, specialties, listTherapists, articles] = await Promise.all([
    getTherapistStats({ citySlug: city }),
    getSpecialties(),
    getTherapists({ citySlug: city, limit: 24 }),
    getFeaturedArticles(3),
  ]);

  const copy = buildCityLandingCopy({
    cityName,
    total: stats.total,
    onlineCount: stats.online,
  });

  const description =
    locale === 'tr'
      ? `${cityName}${getLocativeSuffix(cityName, true)} uzman psikolog, klinik psikolog ve psikiyatristleri keşfedin.`
      : `Discover verified psychologists, clinical psychologists and psychiatrists in ${cityName}.`;

  const schemas: object[] = [
    buildCollectionPageSchema({
      name: locale === 'tr' ? `${cityName} Terapistleri` : `Therapists in ${cityName}`,
      description,
      url: pageUrl,
      locale,
    }),
    buildBreadcrumbSchema([
      { name: homeLabel, url: absUrl('/' + locale) },
      { name: listLabel, url: absUrl(`/${locale}/${listBase}`) },
      { name: cityName, url: pageUrl },
    ]),
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
    specialties,
  });

  const cityLinks = buildSimilarCityLinks({ locale, currentCitySlug: city });
  const specialtyLinks = buildSpecialtyLinks({ locale, citySlug: city, cityName, specialties });
  const mapEmbedUrl = buildCityEmbedUrl(cityName, locale);
  const mapTitle = `${cityName} Haritası`;

  const intro =
    locale === 'tr'
      ? `${cityName}${getLocativeSuffix(cityName)} çalışan psikolog, klinik psikolog, psikiyatrist ve terapistleri inceleyebilir; uzmanlık alanına, ilçeye ve görüşme türüne göre filtreleyebilirsiniz.`
      : `Browse therapists in ${cityName} and filter by specialty, district and session type.`;

  // İlçe filtresi aktifken varsayılan başlık kullanılır (ilçe adı H1'e yansır).
  const useLandingHeader = !searchParams.district;

  const emptyMessage = `${cityName}${getLocativeSuffix(cityName)} bu kriterlerde kayıtlı uzman şu anda bulunmuyor. Filtreleri değiştirerek veya aşağıdaki bağlantılardan diğer seçenekleri inceleyebilirsiniz.`;

  return (
    <>
      <JsonLd schema={schemas} />
      <TherapistListing
        locale={locale}
        citySlug={city}
        searchParams={searchParams}
        headerOverride={
          useLandingHeader ? (
            <SeoLandingHeader
              breadcrumbs={[
                { label: homeLabel, href: `/${locale}` },
                { label: listLabel, href: `/${locale}/${listBase}` },
                { label: cityName },
              ]}
              h1={locale === 'tr' ? `${cityName} Terapistleri` : `Therapists in ${cityName}`}
              intro={intro}
              total={stats.total}
              onlineCount={stats.online}
              inPersonCount={stats.inPerson}
              ctaHref={`/${locale}/${listBase}/${city}?online=1`}
              ctaLabel="Online Uzmanları Gör"
            />
          ) : undefined
        }
        belowResults={
          useLandingHeader ? (
            <SeoLandingSections
              locale={locale}
              copy={copy}
              mapEmbedUrl={mapEmbedUrl}
              mapTitle={mapTitle}
              articles={articles}
              cityLinks={cityLinks}
              specialtyLinks={specialtyLinks}
            />
          ) : undefined
        }
        emptyExtra={
          <SeoEmptySuggestions message={emptyMessage} links={internalLinks} />
        }
      />
    </>
  );
}
