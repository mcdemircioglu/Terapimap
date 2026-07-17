/**
 * /[locale]/psikoloji-rehberi — rehber liste sayfası (server component).
 * Kategori filtresi ?kategori= query parametresiyle çalışır:
 *  - canonical her zaman temiz /psikoloji-rehberi URL'idir
 *  - filtreli görünümler noindex,follow alır
 *  - geçersiz kategori değeri sessizce yok sayılır (tümü gösterilir)
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { unstable_setRequestLocale } from 'next-intl/server';
import Container from '@/components/Container';
import JsonLd from '@/components/JsonLd';
import ArticleCard from '@/components/guide/ArticleCard';
import CategoryFilter from '@/components/guide/CategoryFilter';
import TherapistCta from '@/components/guide/TherapistCta';
import { getPublishedArticles } from '@/lib/articles';
import { absUrl, buildBreadcrumbSchema, buildCollectionPageSchema } from '@/lib/schema';
import { isArticleCategory, ARTICLE_CATEGORY_LABELS } from '@/types/database';

const DESCRIPTION =
  'Terapi süreci, psikolojik konular, terapi yöntemleri ve terapist seçimi hakkında anlaşılır ve güvenilir rehberleri keşfedin.';

export function generateMetadata({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { kategori?: string };
}): Metadata {
  const canonical = absUrl(`/${locale}/psikoloji-rehberi`);
  const filtered = Boolean(searchParams.kategori);

  return {
    title: 'Psikoloji Rehberi | Terapimap',
    description: DESCRIPTION,
    alternates: {
      canonical,
      languages: {
        tr: absUrl('/tr/psikoloji-rehberi'),
        en: absUrl('/en/psikoloji-rehberi'),
      },
    },
    // Filtreli query URL'leri indexlenmesin; linkler takip edilsin
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
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

  // Geçersiz kategori → filtre yok (hata sayfası üretilmez)
  const category =
    searchParams.kategori && isArticleCategory(searchParams.kategori)
      ? searchParams.kategori
      : null;

  const [articles, allArticles] = await Promise.all([
    category ? getPublishedArticles({ category }) : getPublishedArticles(),
    Promise.resolve(null),
  ]);
  void allArticles;

  const featured = category ? [] : articles.filter((a) => a.is_featured).slice(0, 3);
  const rest = category ? articles : articles.filter((a) => !featured.some((f) => f.id === a.id));

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
          <CategoryFilter locale={locale} active={category} />
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
              {category
                ? `${ARTICLE_CATEGORY_LABELS[category]} kategorisinde henüz içerik yok.`
                : 'Henüz yayınlanmış içerik yok. Çok yakında burada olacak.'}
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
