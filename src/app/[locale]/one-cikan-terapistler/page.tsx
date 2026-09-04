import type { Metadata } from 'next';
import Link from 'next/link';
import { unstable_setRequestLocale } from 'next-intl/server';
import Container from '@/components/Container';
import TherapistGrid from '@/components/TherapistGrid';
import { Button } from '@/components/ui/Button';
import JsonLd from '@/components/JsonLd';
import { absUrl, buildCollectionPageSchema, buildBreadcrumbSchema } from '@/lib/schema';
import { getFeaturedTherapists } from '@/lib/queries';
import { getTherapistsListPath } from '@/lib/utils';

// Öne çıkan liste günde bir tazelenir (öne çıkarma değişimleri seyrek).
export const revalidate = 3600;

const PATH = 'one-cikan-terapistler';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const url = absUrl(`/${locale}/${PATH}`);
  const title =
    locale === 'tr'
      ? 'Öne Çıkan Terapistler | Terapimap'
      : 'Featured Therapists | Terapimap';
  const description =
    locale === 'tr'
      ? 'Terapimap’te öne çıkan, doğrulanmış psikolog ve terapistleri keşfedin. Yüksek puanlı ve aktif olarak danışan kabul eden uzmanlar.'
      : 'Discover featured, verified psychologists and therapists on Terapimap.';

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: locale === 'tr', follow: true },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: 'Terapimap',
      locale: locale === 'tr' ? 'tr_TR' : 'en_US',
    },
    twitter: { card: 'summary', title, description },
  };
}

export default async function OneCikanTerapistlerPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);

  const featured = await getFeaturedTherapists(100);

  const pageTitle = locale === 'tr' ? 'Öne Çıkan Terapistler' : 'Featured Therapists';
  const pageDesc =
    locale === 'tr'
      ? 'Yüksek puan alan ve aktif olarak danışan kabul eden, doğrulanmış uzmanlar.'
      : 'Verified specialists with high ratings who are actively accepting clients.';

  const homeLabel = locale === 'tr' ? 'Ana Sayfa' : 'Home';
  const url = absUrl(`/${locale}/${PATH}`);

  const schemas = [
    buildCollectionPageSchema({ name: pageTitle, description: pageDesc, url, locale }),
    buildBreadcrumbSchema([
      { name: homeLabel, url: absUrl('/' + locale) },
      { name: pageTitle, url },
    ]),
  ];

  return (
    <>
      <JsonLd schema={schemas} />
      <Container className="py-10 md:py-16">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold text-brand-900 md:text-4xl">{pageTitle}</h1>
          <p className="mt-3 text-brand-700 md:text-lg">{pageDesc}</p>
        </div>

        {featured.length > 0 ? (
          <div className="mt-8 md:mt-10">
            <TherapistGrid therapists={featured} locale={locale} />
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-brand-100 bg-brand-50/50 p-8 text-center">
            <p className="text-brand-700">
              {locale === 'tr'
                ? 'Şu anda öne çıkan bir terapist bulunmuyor.'
                : 'There are no featured therapists at the moment.'}
            </p>
            <div className="mt-5">
              <Link href={getTherapistsListPath(locale)}>
                <Button variant="outline">
                  {locale === 'tr' ? 'Tüm terapistleri gör' : 'Browse all therapists'}
                </Button>
              </Link>
            </div>
          </div>
        )}

        {featured.length > 0 && (
          <div className="mt-10 text-center">
            <Link href={getTherapistsListPath(locale)}>
              <Button variant="outline">
                {locale === 'tr' ? 'Tüm terapistleri gör' : 'Browse all therapists'}
              </Button>
            </Link>
          </div>
        )}
      </Container>
    </>
  );
}
