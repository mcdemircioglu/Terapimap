import type { Metadata } from 'next';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import TherapistListing from '@/components/TherapistListing';
import JsonLd from '@/components/JsonLd';
import { absUrl, buildCollectionPageSchema, buildBreadcrumbSchema } from '@/lib/schema';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'list' });
  const url = absUrl('/' + locale + '/therapists');

  const title = t('titleAll');
  const description =
    locale === 'tr'
      ? 'Turkiye genelinde psikolog, klinik psikolog ve terapistleri kesfet. Sehir, uzmanlik alani ve seans turune gore filtrele.'
      : 'Discover psychologists, clinical psychologists and therapists across Turkey. Filter by city, specialty and session type.';

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        tr: absUrl('/tr/therapists'),
        en: absUrl('/en/therapists'),
      },
    },
    openGraph: {
      title,
      description,
      url,
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
  searchParams: { online?: string; specialty?: string; city?: string };
}) {
  unstable_setRequestLocale(params.locale);
  const locale = params.locale;
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
