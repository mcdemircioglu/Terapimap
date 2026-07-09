import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { unstable_setRequestLocale } from 'next-intl/server';
import TherapistListing from '@/components/TherapistListing';
import JsonLd from '@/components/JsonLd';
import SeoLandingHeader from '@/components/seo/SeoLandingHeader';
import SeoContentSection from '@/components/seo/SeoContentSection';
import SeoEmptySuggestions from '@/components/seo/SeoEmptySuggestions';
import { getCityName, isKnownCity } from '@/lib/cities';
import { getSpecialties, getTherapists, getTherapistStats } from '@/lib/queries';
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
  landingCanonical,
} from '@/lib/seo-landing';
import { getLocativeSuffix } from '@/lib/utils';

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
    title,
    description: copy.metaDescription,
    alternates: { canonical },
    robots: copy.isIndexable
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

  // İstatistik + JSON-LD ItemList için ilk terapistler (paralel)
  const [stats, listTherapists] = await Promise.all([
    getTherapistStats({ citySlug: city, specialtySlug: specialty }),
    getTherapists({ citySlug: city, specialtySlug: specialty, limit: 24 }),
  ]);

  const copy = await getLandingCopy({
    citySlug: city,
    cityName,
    specialtySlug: specialty,
    specialtyName,
    total: stats.total,
    onlineCount: stats.online,
  });

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

  const emptyMessage = `${cityName}${getLocativeSuffix(cityName)} ${specialtyName.toLocaleLowerCase('tr')} alanında kayıtlı uzman şu anda bulunmuyor. Online çalışan uzmanları inceleyebilir veya aşağıdaki ilgili alanlara göz atabilirsiniz; yeni uzmanlar eklendikçe bu sayfa güncellenir.`;

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
          <SeoContentSection copy={copy} internalLinks={internalLinks} />
        }
        emptyExtra={
          <SeoEmptySuggestions message={emptyMessage} links={internalLinks} />
        }
      />
    </>
  );
}
