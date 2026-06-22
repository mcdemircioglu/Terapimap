import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import TherapistListing from '@/components/TherapistListing';
import JsonLd from '@/components/JsonLd';
import { getCityName, isKnownCity } from '@/lib/cities';
import { getSpecialties } from '@/lib/queries';
import { absUrl, buildCollectionPageSchema, buildBreadcrumbSchema } from '@/lib/schema';

export async function generateMetadata({
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
  const specialtyName = s.name;
  const t = await getTranslations({ locale, namespace: 'list' });
  const page = parseInt(searchParams.page ?? '1', 10) || 1;

  const baseUrl = absUrl('/' + locale + '/therapists/' + city + '/' + specialty);
  const baseTitle = t('titleCitySpecialty', { city: cityName, specialty: specialtyName });
  const title = page > 1 ? `${baseTitle} — Sayfa ${page}` : baseTitle;

  const specialtyLower = specialtyName.toLocaleLowerCase(locale === 'tr' ? 'tr' : 'en');
  const description =
    locale === 'tr'
      ? `${cityName}'de ${specialtyLower} konusunda uzman psikolog ve terapistleri keşfedin. Diploma ve uzmanlık bilgileri doğrulanmış uzmanlarla doğrudan iletişime geçin.`
      : `Discover verified ${specialtyLower} specialists in ${cityName}. Browse credentials and reach out directly.`;

  const canonical = page > 1 ? `${baseUrl}?page=${page}` : baseUrl;

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

export default async function CitySpecialtyPage({
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

  const pageUrl = absUrl('/' + locale + '/therapists/' + city + '/' + specialty);
  const homeLabel = locale === 'tr' ? 'Ana Sayfa' : 'Home';
  const listLabel = locale === 'tr' ? 'Terapistler' : 'Therapists';
  const description =
    locale === 'tr'
      ? `${cityName}'de ${specialtyName.toLocaleLowerCase('tr')} uzmanları`
      : `${specialtyName} specialists in ${cityName}`;

  const schemas = [
    buildCollectionPageSchema({
      name: `${cityName} — ${specialtyName}`,
      description,
      url: pageUrl,
      locale,
    }),
    buildBreadcrumbSchema([
      { name: homeLabel, url: absUrl('/' + locale) },
      { name: listLabel, url: absUrl('/' + locale + '/therapists') },
      { name: cityName, url: absUrl('/' + locale + '/therapists/' + city) },
      { name: specialtyName, url: pageUrl },
    ]),
  ];

  return (
    <>
      <JsonLd schema={schemas} />
      <TherapistListing
        locale={locale}
        citySlug={city}
        specialtySlug={specialty}
        searchParams={searchParams}
      />
    </>
  );
}
