import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import TherapistListing from '@/components/TherapistListing';
import { getCityName, isKnownCity } from '@/lib/cities';
import { getSpecialties } from '@/lib/queries';

export async function generateMetadata({
  params: { locale, city, specialty },
}: {
  params: { locale: string; city: string; specialty: string };
}): Promise<Metadata> {
  const cityName = getCityName(city);
  if (!cityName) return {};
  const specialties = await getSpecialties();
  const s = specialties.find((x) => x.slug === specialty);
  if (!s) return {};
  const specialtyName = s.name;
  const t = await getTranslations({ locale, namespace: 'list' });
  return {
    title: t('titleCitySpecialty', { city: cityName, specialty: specialtyName }),
  };
}

export default function CitySpecialtyPage({
  params,
  searchParams,
}: {
  params: { locale: string; city: string; specialty: string };
  searchParams: {
    online?: string;
    district?: string;
    type?: string;
    inPerson?: string;
  };
}) {
  unstable_setRequestLocale(params.locale);
  if (!isKnownCity(params.city)) notFound();
  return (
    <TherapistListing
      locale={params.locale}
      citySlug={params.city}
      specialtySlug={params.specialty}
      searchParams={searchParams}
    />
  );
}
