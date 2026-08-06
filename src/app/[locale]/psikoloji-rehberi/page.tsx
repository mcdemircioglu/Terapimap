/**
 * /[locale]/psikoloji-rehberi — rehber ana liste sayfası (server component).
 * Kategoriler artık gerçek URL'lerde yaşar: /psikoloji-rehberi/kategori/[kategori].
 * Eski ?kategori= linkleri kalıcı olarak yeni URL'e yönlendirilir.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { unstable_setRequestLocale } from 'next-intl/server';
import Container from '@/components/Container';
import JsonLd from '@/components/JsonLd';
import ArticleCard from '@/components/guide/ArticleCard';
import CategoryFilter from '@/components/guide/CategoryFilter';
import TherapistCta from '@/components/guide/TherapistCta';
import { getPublishedArticles } from '@/lib/articles';
import { absUrl, buildBreadcrumbSchema, buildCollectionPageSchema } from '@/lib/schema';
import { isArticleCategory } from '@/types/database';

// ISR: sayfa saatte bir yenilenir (Fluid CPU tasarrufu).
export const revalidate = 3600;

const DESCRIPTION =
  'Terapi süreci, psikolojik konular, terapi yöntemleri ve terapist seçimi hakkında anlaşılır ve güvenilir rehberleri keşfedin.';

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Metadata {
  const canonical = absUrl(`/${locale}/psikoloji-rehberi`);

  return {
    title: 'Psikoloji Rehberi | Terapimap',
    description: DESCRIPTION,
    alternates: { canonical },
    robots: { index: locale === 'tr', follow: true },
    openGraph: {
      title: 'Psikoloji Rehberi | Terapimap',
      description: DESCRIPTION,
      type: 'website',
      url: canonical,
    },
  };
}

export default async function PsikolojiRehberiPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { kategori?: string };
}) {
  unstable_setRequestLocale(locale);

  // Eski ?kategori= linkleri → yeni gerçek URL (301)
  if (searchParams.kategori && isArticleCategory(searchParams.kategori)) {
    permanentRedirect(`/${locale}/psikoloji-rehberi/kategori/${searchParams.kategori}`);
  }

  const articles = await getPublishedArticles();
  const featured = articles.filter((a) => a.is_featured).slice(0, 3);
  const rest = articles.filter((a) => !featured.some((f) => f.id === a.id));

  const homeLabel = locale === 'tr' ? 'Ana Sayfa' : 'Home';
  const pageUrl = absUrl(`/${locale}/psikoloji-rehberi`);

  const schemas = [
    buildCollectionPageSchema({
      name: 'Psikoloji Rehberi',
      description: DESCRIPTION,
      url: pageUrl,
      locale,
    }),
    buildBreadcrumbSchema([
      { name: homeLabel, url: absUrl('/' + locale) },
      { name: 'Psikoloji Rehberi', url: pageUrl },
    ]),
  ];

  return (
    <>
      <JsonLd schema={schemas} />
      <Container className="py-10 md:py-14">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-brand-600" aria-label="Breadcrumb">
          <Link href={'/' + locale} className="hover:text-brand-800">
            {homeLabel}
          </Link>
          <span className="mx-2">·</span>
          <span className="text-brand-800">Psikoloji Rehberi</span>
        </nav>

        <h1 className="text-3xl font-semibold text-brand-900 md:text-4xl">Psikoloji Rehberi</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-brand-600">{DESCRIPTION}</p>

        {/* Kategori filtreleri */}
        <div className="mt-8">
          <CategoryFilter locale={locale} active={null} />
        </div>

        {/* Öne çıkanlar */}
        {featured.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-brand-900">Öne Çıkanlar</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((article) => (
                <ArticleCard key={article.id} article={article} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {/* Tüm içerikler */}
        <section className="mt-10">
          {featured.length > 0 && (
            <h2 className="text-lg font-semibold text-brand-900">Tüm Rehberler</h2>
          )}
          {rest.length > 0 ? (
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((article) => (
                <ArticleCard key={article.id} article={article} locale={locale} />
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-brand-100 bg-brand-50/50 p-6 text-sm text-brand-600">
              Henüz yayınlanmış içerik yok. Çok yakında burada olacak.
            </p>
          )}
        </section>

        {/* Terapist CTA */}
        <div className="mt-14">
          <TherapistCta locale={locale} />
        </div>
      </Container>
    </>
  );
}
