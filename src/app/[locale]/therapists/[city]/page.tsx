import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import TherapistListing from '@/components/TherapistListing';
import { CITIES, getCityName, isKnownCity } from '@/lib/cities';

export function generateStaticParams() {
  // Pre-render the well-known cities for SEO.
  return CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({
  params: { locale, city },
}: {
  params: { locale: string; city: string };
}): Promise<Metadata> {
  const cityName = getCityName(city);
  if (!cityName) return {};
  const t = await getTranslations({ locale, namespace: 'list' });
  return { title: t('titleCity', { city: cityName }) };
}

export default function CityPage({
  params,
  searchParams,
}: {
  params: { locale: string; city: string };
  searchParams: { online?: string; specialty?: string };
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
