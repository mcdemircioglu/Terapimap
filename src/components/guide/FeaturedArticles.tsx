/**
 * Ana sayfa "Psikoloji Rehberi" bölümü — server component.
 * is_featured içerikleri öne alır; yoksa en yeni yayınlarla doldurur.
 * Hiç yayınlanmış içerik yoksa bölüm hiç render edilmez.
 */
import Link from 'next/link';
import Container from '@/components/Container';
import ArticleCard from '@/components/guide/ArticleCard';
import { getFeaturedArticles } from '@/lib/articles';

type Props = {
  locale: string;
};

export default async function FeaturedArticles({ locale }: Props) {
  const articles = await getFeaturedArticles(3);
  if (articles.length === 0) return null;

  return (
    <section className="bg-brand-50/40">
      <Container className="py-14 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-brand-900">Psikoloji Rehberi</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-600">
              Terapi süreci, psikolojik konular ve ruh sağlığı hakkında anlaşılır rehberler.
            </p>
          </div>
          <Link
            href={`/${locale}/psikoloji-rehberi`}
            className="text-sm font-medium text-brand-600 hover:text-brand-800 hover:underline"
          >
            Tüm rehberleri incele →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} locale={locale} />
          ))}
        </div>
      </Container>
    </section>
  );
}
