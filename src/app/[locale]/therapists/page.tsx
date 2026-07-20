import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import TherapistListing from '@/components/TherapistListing';
import JsonLd from '@/components/JsonLd';
import { absUrl, buildCollectionPageSchema, buildBreadcrumbSchema } from '@/lib/schema';
import { getSpecialties } from '@/lib/queries';

/** Locale'e göre görünen liste URL segmenti (rewrites ile eşleşir). */
function listPath(locale: string): string {
  return locale === 'tr' ? 'terapistler' : 'therapists';
}

export async function generateMetadata({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { page?: string; specialty?: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'list' });
  const baseUrl = absUrl(`/${locale}/${listPath(locale)}`);
  const page = parseInt(searchParams.page ?? '1', 10) || 1;

  // ?specialty= filtresi: başlığı uzmanlığa göre üret, canonical'ı
  // uzmanlığın kendi landing sayfasına (/tr/anksiyete) işaret ettir.
  let specialtyName: string | null = null;
  let specialtyCanonical: string | null = null;
  if (searchParams.specialty) {
    const specialties = await getSpecialties();
    const s = specialties.find((x) => x.slug === searchParams.specialty);
    if (s) {
      specialtyName = s.name;
      specialtyCanonical = absUrl(`/${locale}/${s.slug}`);
    }
  }

  const baseTitle = specialtyName
    ? locale === 'tr'
      ? `${specialtyName} Terapistleri | Terapimap`
      : `${specialtyName} Therapists | Terapimap`
    : t('titleAll');
  const title = page > 1 ? `${baseTitle} — Sayfa ${page}` : baseTitle;

  const description = specialtyName
    ? locale === 'tr'
      ? `${specialtyName} alanında çalışan uzman psikolog ve terapistleri inceleyin. Şehir ve görüşme türüne göre filtreleyin, size uygun uzmanı seçin.`
      : `Browse ${specialtyName} specialists across Turkey. Filter by city and session type.`
    : locale === 'tr'
      ? 'Türkiye genelinde psikolog, klinik psikolog ve terapistleri keşfet. Şehir, uzmanlık alanı ve seans türüne göre filtrele.'
      : 'Discover psychologists, clinical psychologists and therapists across Turkey. Filter by city, specialty and session type.';

  const canonical =
    specialtyCanonical ?? (page > 1 ? `${baseUrl}?page=${page}` : baseUrl);

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
      title,
      description,
    },
  };
}

export default function TherapistsPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: {
    online?: string;
    specialty?: string;
    city?: string;
    district?: string;
    type?: string;
    inPerson?: string;
    page?: string;
  };
}) {
  unstable_setRequestLocale(params.locale);
  const locale = params.locale;

  // ?city=istanbul → /therapists/istanbul (SEO clean URL)
  if (searchParams.city) {
    const qs = new URLSearchParams();
    if (searchParams.specialty) qs.set('specialty', searchParams.specialty);
    if (searchParams.district) qs.set('district', searchParams.district);
    if (searchParams.type) qs.set('type', searchParams.type);
    if (searchParams.online) qs.set('online', searchParams.online);
    if (searchParams.inPerson) qs.set('inPerson', searchParams.inPerson);
    const suffix = qs.toString() ? '?' + qs.toString() : '';
    redirect(`/${locale}/${listPath(locale)}/${searchParams.city}${suffix}`);
  }
  const pageUrl = absUrl(`/${locale}/${listPath(locale)}`);

  const pageTitle =
    locale === 'tr' ? 'Terapist ve Psikolog Listesi' : 'Browse Therapists';
  const pageDesc =
    locale === 'tr'
      ? 'Turkiye genelinde psikolog, klinik psikolog ve terapistleri kesfet.'
      : 'Discover psychologists, clinical psychologists and therapists across Turkey.';

  const homeLabel = locale === 'tr' ? 'Ana Sayfa' : 'Home';
  const listLabel = locale === 'tr' ? 'Terapistler' : 'Therapists';

  const schemas = [
    buildCollectionPageSchema({
      name: pageTitle,
      description: pageDesc,
      url: pageUrl,
      locale,
    }),
    buildBreadcrumbSchema([
      { name: homeLabel, url: absUrl('/' + locale) },
      { name: listLabel, url: pageUrl },
    ]),
  ];

  return (
    <>
      <JsonLd schema={schemas} />
      <TherapistListing locale={locale} searchParams={searchParams} />
    </>
  );
}
