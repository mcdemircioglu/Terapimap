import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import TherapistListing from '@/components/TherapistListing';
import JsonLd from '@/components/JsonLd';
import { absUrl, buildCollectionPageSchema, buildBreadcrumbSchema } from '@/lib/schema';

export async function generateMetadata({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { page?: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'list' });
  const baseUrl = absUrl('/' + locale + '/therapists');
  const page = parseInt(searchParams.page ?? '1', 10) || 1;

  const baseTitle = t('titleAll');
  const title = page > 1 ? `${baseTitle} — Sayfa ${page}` : baseTitle;
  const description =
    locale === 'tr'
      ? 'Turkiye genelinde psikolog, klinik psikolog ve terapistleri kesfet. Sehir, uzmanlik alani ve seans turune gore filtrele.'
      : 'Discover psychologists, clinical psychologists and therapists across Turkey. Filter by city, specialty and session type.';

  const canonical = page > 1 ? `${baseUrl}?page=${page}` : baseUrl;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        tr: absUrl('/tr/therapists') + (page > 1 ? `?page=${page}` : ''),
        en: absUrl('/en/therapists') + (page > 1 ? `?page=${page}` : ''),
      },
    },
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
    redirect('/' + locale + '/therapists/' + searchParams.city + suffix);
  }
  const pageUrl = absUrl('/' + locale + '/therapists');

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
