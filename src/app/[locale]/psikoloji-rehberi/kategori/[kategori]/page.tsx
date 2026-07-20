/**
 * /[locale]/psikoloji-rehberi/kategori/[kategori] — indexlenebilir kategori hub'ı.
 * Not: statik "kategori" segmenti, kardeş [slug] route'undan önceliklidir;
 * makale slug'larıyla çakışma olmaz.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { unstable_setRequestLocale } from 'next-intl/server';
import Container from '@/components/Container';
import JsonLd from '@/components/JsonLd';
import ArticleCard from '@/components/guide/ArticleCard';
import CategoryFilter from '@/components/guide/CategoryFilter';
import TherapistCta from '@/components/guide/TherapistCta';
import {
  CATEGORY_CONTENT,
  CATEGORY_CTA_SPECIALTY,
  getPublishedArticles,
} from '@/lib/articles';
import { absUrl, buildBreadcrumbSchema, buildCollectionPageSchema } from '@/lib/schema';
import { isArticleCategory } from '@/types/database';

type Params = { params: { locale: string; kategori: string } };

export function generateMetadata({ params: { locale, kategori } }: Params): Metadata {
  if (!isArticleCategory(kategori)) return {};
  const content = CATEGORY_CONTENT[kategori];
  const canonical = absUrl(`/${locale}/psikoloji-rehberi/kategori/${kategori}`);

  return {
    title: content.metaTitle,
    description: content.metaDescription,
    alternates: { canonical },
    robots: { index: locale === 'tr', follow: true },
    openGraph: {
      title: content.metaTitle,
      description: content.metaDescription,
      type: 'website',
      url: canonical,
    },
  };
}

export default async function KategoriPage({ params: { locale, kategori } }: Params) {
  unstable_setRequestLocale(locale);

  // Geçersiz kategori → temiz URL'e yönlendir (hata sayfası üretme)
  if (!isArticleCategory(kategori)) redirect(`/${locale}/psikoloji-rehberi`);

  const content = CATEGORY_CONTENT[kategori];
  const articles = await getPublishedArticles({ category: kategori });

  const homeLabel = locale === 'tr' ? 'Ana Sayfa' : 'Home';
  const guideUrl = absUrl(`/${locale}/psikoloji-rehberi`);
  const pageUrl = absUrl(`/${locale}/psikoloji-rehberi/kategori/${kategori}`);

  const schemas = [
    buildCollectionPageSchema({
      name: content.title + ' — Psikoloji Rehberi',
      description: content.metaDescription,
      url: pageUrl,
      locale,
    }),
    buildBreadcrumbSchema([
      { name: homeLabel, url: absUrl('/' + locale) },
      { name: 'Psikoloji Rehberi', url: guideUrl },
      { name: content.title, url: pageUrl },
    ]),
  ];

  const ctaSpecialty = CATEGORY_CTA_SPECIALTY[kategori];

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
          <Link href={`/${locale}/psikoloji-rehberi`} className="hover:text-brand-800">
            Psikoloji Rehberi
          </Link>
          <span className="mx-2">·</span>
          <span className="text-brand-800">{content.title}</span>
        </nav>

        <h1 className="text-3xl font-semibold text-brand-900 md:text-4xl">{content.title}</h1>
        <p className="mt-4 max-w-3xl leading-relaxed text-brand-700">{content.intro}</p>

        {/* Kategori navigasyonu */}
        <div className="mt-8">
          <CategoryFilter locale={locale} active={kategori} />
        </div>

        {/* İçerikler */}
        <section className="mt-10">
          {articles.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} locale={locale} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-brand-100 bg-brand-50/50 p-6 text-sm text-brand-600">
              Bu kategoride henüz yayınlanmış içerik yok. Çok yakında burada olacak.
            </p>
          )}
        </section>

        {/* Terapist CTA — kategoriyle eşleşen uzmanlık sayfasına yönlenir */}
        <div className="mt-14">
          <TherapistCta
            locale={locale}
            href={ctaSpecialty ? `/${locale}/${ctaSpecialty}` : undefined}
          />
        </div>
      </Container>
    </>
  );
}
