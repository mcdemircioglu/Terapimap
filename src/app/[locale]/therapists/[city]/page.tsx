import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import TherapistListing from '@/components/TherapistListing';
import { CITIES, getCityName, isKnownCity } from '@/lib/cities';
import { getDistricts } from '@/lib/queries';
import { absUrl } from '@/lib/schema';
import { findBySlug } from '@/lib/utils';

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

  const qs = new URLSearchParams();
  if (searchParams.district) qs.set('district', searchParams.district);
  if (page > 1) qs.set('page', String(page));
  const canonical = qs.toString() ? `${baseUrl}?${qs}` : baseUrl;

  return {
    title,
    alternates: { canonical },
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
  return (
    <TherapistListing
      locale={params.locale}
      citySlug={params.city}
      searchParams={searchParams}
    />
  );
}
