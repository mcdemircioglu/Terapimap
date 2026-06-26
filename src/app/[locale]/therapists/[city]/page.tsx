import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import TherapistListing from '@/components/TherapistListing';
import JsonLd from '@/components/JsonLd';
import { CITIES, getCityName, isKnownCity } from '@/lib/cities';
import { getDistricts } from '@/lib/queries';
import { absUrl, buildCollectionPageSchema, buildBreadcrumbSchema } from '@/lib/schema';
import { findBySlug, getLocativeSuffix } from '@/lib/utils';

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
  const baseUrl = absUrl('/' + locale + '/therapists/' + city);

  // District slug → display name
  let districtName: string | undefined;
  if (searchParams.district) {
    const districts = await getDistricts(city);
    districtName = findBySlug(districts, searchParams.district);
  }

  const baseTitle = districtName
    ? `${cityName} ${districtName} Terapistleri`
    : t('titleCity', { city: cityName });
  const title = page > 1 ? `${baseTitle} — Sayfa ${page}` : baseTitle;

  const place = districtName ? `${cityName} ${districtName}` : cityName;
  const description =
    locale === 'tr'
      ? `${place}${getLocativeSuffix(place, true)} uzman psikolog, klinik psikolog ve psikiyatristleri keşfedin. Uzmanlık alanı, görüşme türü ve daha fazlasına göre filtreleyin.`
      : `Discover verified psychologists, clinical psychologists and psychiatrists in ${place}. Filter by specialty, session type and more.`;

  const qs = new URLSearchParams();
  if (searchParams.district) qs.set('district', searchParams.district);
  if (page > 1) qs.set('page', String(page));
  const canonical = qs.toString() ? `${baseUrl}?${qs}` : baseUrl;

  return {
    title,
    description,
    alternates: { canonical },
    robots: page > 1 ? { index: true, follow: true } : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      locale: locale === 'tr' ? 'tr_TR' : 'en_US',
    },
  };
}

export default function CityPage({
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
  const pageUrl = absUrl('/' + locale + '/therapists/' + city);
  const homeLabel = locale === 'tr' ? 'Ana Sayfa' : 'Home';
  const listLabel = locale === 'tr' ? 'Terapistler' : 'Therapists';
  const description =
    locale === 'tr'
      ? `${cityName}${getLocativeSuffix(cityName, true)} uzman psikolog, klinik psikolog ve psikiyatristleri keşfedin.`
      : `Discover verified psychologists, clinical psychologists and psychiatrists in ${cityName}.`;

  const schemas = [
    buildCollectionPageSchema({
      name: locale === 'tr' ? `${cityName} Terapistleri` : `Therapists in ${cityName}`,
      description,
      url: pageUrl,
      locale,
    }),
    buildBreadcrumbSchema([
      { name: homeLabel, url: absUrl('/' + locale) },
      { name: listLabel, url: absUrl('/' + locale + '/therapists') },
      { name: cityName, url: pageUrl },
    ]),
  ];

  return (
    <>
      <JsonLd schema={schemas} />
      <TherapistListing
        locale={locale}
        citySlug={city}
        searchParams={searchParams}
      />
    </>
  );
}
