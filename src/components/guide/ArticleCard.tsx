/**
 * Rehber içerik kartı — mevcut Card tasarım diliyle.
 * Liste sayfası, benzer içerikler ve ana sayfa bölümünde kullanılır.
 */
import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ARTICLE_CATEGORY_LABELS } from '@/types/database';
import type { ArticleListItem } from '@/types/database';

type Props = {
  article: ArticleListItem;
  locale: string;
};

export default function ArticleCard({ article, locale }: Props) {
  const href = `/${locale}/psikoloji-rehberi/${article.slug}`;

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      {article.cover_image_url && (
        <Link href={href} className="relative block aspect-[16/9] overflow-hidden bg-brand-50" tabIndex={-1}>
          <Image
            src={article.cover_image_url}
            alt={article.title}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="brand">{ARTICLE_CATEGORY_LABELS[article.category]}</Badge>
          <span className="text-xs text-brand-500">{article.reading_minutes} dk okuma</span>
        </div>
        <h3 className="mt-3 text-base font-semibold leading-snug text-brand-900">
          <Link href={href} className="hover:text-brand-700">
            {article.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-brand-600">
          {article.excerpt}
        </p>
        <Link
          href={href}
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-800 hover:underline"
        >
          Devamını oku
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </div>
    </Card>
  );
}
