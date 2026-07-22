/**
 * /[locale]/psikoloji-rehberi/[slug] — içerik detay sayfası (server component).
 * Yalnızca yayınlanmış içerikler görünür (RLS + sorgu filtresi); draft → 404.
 * İçerik Markdown olarak saklanır ve react-markdown ile GÜVENLİ render edilir:
 * ham HTML desteği kapalıdır (rehype-raw yok, dangerouslySetInnerHTML yok).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { unstable_setRequestLocale } from 'next-intl/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Container from '@/components/Container';
import JsonLd from '@/components/JsonLd';
import { Badge } from '@/components/ui/Badge';
import ArticleCard from '@/components/guide/ArticleCard';
import ArticleDisclaimer from '@/components/guide/ArticleDisclaimer';
import TherapistCta from '@/components/guide/TherapistCta';
import { CATEGORY_CTA_SPECIALTY, calculateReadingMinutes, getArticleBySlug, getRelatedArticles } from '@/lib/articles';
import { absUrl, buildArticleSchema, buildBreadcrumbSchema } from '@/lib/schema';
import { ARTICLE_CATEGORY_LABELS } from '@/types/database';

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const article = await getArticleBySlug(slug);
  if (!article) return {};

  const title = article.meta_title ?? `${article.title} | Terapimap`;
  const description = article.meta_description ?? article.excerpt;
  const canonical = absUrl(`/${locale}/psikoloji-rehberi/${article.slug}`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonical,
      ...(article.published_at ? { publishedTime: article.published_at } : {}),
      modifiedTime: article.updated_at,
      ...(article.cover_image_url ? { images: [{ url: article.cover_image_url }] } : {}),
    },
  };
}

/** Dış bağlantılara güvenli davranış; iç bağlantılar normal <a> olarak kalır. */
function MarkdownLink({ href, children }: { href?: string; children?: React.ReactNode }) {
  const url = href ?? '#';
  const isExternal = /^https?:\/\//i.test(url) && !url.startsWith(absUrl(''));
  return (
    <a
      href={url}
      className="font-medium text-brand-600 underline underline-offset-2 hover:text-brand-800"
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  );
}

export default async function ArticleDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  unstable_setRequestLocale(locale);

  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const related = await getRelatedArticles(article.category, article.id, 3);
  const categoryLabel = ARTICLE_CATEGORY_LABELS[article.category];
  const readingMinutes = calculateReadingMinutes(article.content);
  const homeLabel = locale === 'tr' ? 'Ana Sayfa' : 'Home';
  const guideUrl = absUrl(`/${locale}/psikoloji-rehberi`);
  const pageUrl = absUrl(`/${locale}/psikoloji-rehberi/${article.slug}`);

  const displayDate = article.published_at ?? article.updated_at;
  const formattedDate = new Date(displayDate).toLocaleDateString(
    locale === 'tr' ? 'tr-TR' : 'en-US',
    { day: 'numeric', month: 'long', year: 'numeric' },
  );

  const schemas = [
    buildArticleSchema(article, locale, categoryLabel),
    buildBreadcrumbSchema([
      { name: homeLabel, url: absUrl('/' + locale) },
      { name: 'Psikoloji Rehberi', url: guideUrl },
      { name: article.title, url: pageUrl },
    ]),
  ];

  return (
    <>
      <JsonLd schema={schemas} />
      <Container className="py-10 md:py-14">
        <div className="mx-auto max-w-3xl">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-brand-600" aria-label="Breadcrumb">
            <Link href={'/' + locale} className="hover:text-brand-800">
              {homeLabel}
            </Link>
            <span className="mx-2">·</span>
            <Link href={`/${locale}/psikoloji-rehberi`} className="hover:text-brand-800">
              Psikoloji Rehberi
            </Link>
          </nav>

          {/* Başlık alanı */}
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/${locale}/psikoloji-rehberi/kategori/${article.category}`}>
              <Badge variant="brand" className="cursor-pointer hover:bg-brand-200">
                {categoryLabel}
              </Badge>
            </Link>
            <span className="text-xs text-brand-500">{readingMinutes} dk okuma</span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold leading-tight text-brand-900 md:text-4xl">
            {article.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-brand-600">{article.excerpt}</p>
          <p className="mt-3 text-sm text-brand-500">
            <time dateTime={displayDate}>{formattedDate}</time>
          </p>

          {/* Kapak görseli */}
          {article.cover_image_url && (
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl border border-brand-100 bg-brand-50">
              <Image
                src={article.cover_image_url}
                alt={article.title}
                fill
                priority
                unoptimized
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            </div>
          )}

          {/* İçerik gövdesi — Markdown, ham HTML kapalı */}
          <div className="mt-10">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => (
                  <h2 className="mt-10 text-2xl font-semibold text-brand-900">{children}</h2>
                ),
                h2: ({ children }) => (
                  <h2 className="mt-10 text-2xl font-semibold text-brand-900">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mt-8 text-xl font-semibold text-brand-900">{children}</h3>
                ),
                p: ({ children }) => (
                  <p className="mt-5 leading-relaxed text-brand-800">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="mt-5 list-disc space-y-2 pl-6 leading-relaxed text-brand-800">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="mt-5 list-decimal space-y-2 pl-6 leading-relaxed text-brand-800">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li>{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-brand-900">{children}</strong>
                ),
                em: ({ children }) => <em>{children}</em>,
                blockquote: ({ children }) => (
                  <blockquote className="mt-5 border-l-4 border-brand-200 pl-4 italic text-brand-700">
                    {children}
                  </blockquote>
                ),
                a: MarkdownLink,
              }}
            >
              {article.content}
            </ReactMarkdown>
          </div>

          {/* Bilgilendirme notu */}
          <div className="mt-12">
            <ArticleDisclaimer />
          </div>

          {/* Terapist CTA — kategoriyle eşleşen uzmanlık sayfasına yönlenir */}
          <div className="mt-8">
            <TherapistCta
              locale={locale}
              href={
                CATEGORY_CTA_SPECIALTY[article.category]
                  ? `/${locale}/${CATEGORY_CTA_SPECIALTY[article.category]}`
                  : undefined
              }
            />
          </div>
        </div>

        {/* Benzer içerikler */}
        {related.length > 0 && (
          <section className="mx-auto mt-14 max-w-5xl">
            <h2 className="text-lg font-semibold text-brand-900">Benzer İçerikler</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ArticleCard key={item.id} article={item} locale={locale} />
              ))}
            </div>
          </section>
        )}
      </Container>
    </>
  );
}
