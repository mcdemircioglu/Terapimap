/**
 * Kategori navigasyonu — her kategori kendi indexlenebilir hub URL'ine
 * (/psikoloji-rehberi/kategori/[kategori]) linkler.
 */
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ARTICLE_CATEGORIES, ARTICLE_CATEGORY_LABELS } from '@/types/database';
import type { ArticleCategory } from '@/types/database';

type Props = {
  locale: string;
  active: ArticleCategory | null;
};

export default function CategoryFilter({ locale, active }: Props) {
  const base = `/${locale}/psikoloji-rehberi`;

  const chip = (label: string, href: string, isActive: boolean) => (
    <Link
      key={href}
      href={href}
      className={cn(
        'inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
        isActive
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-brand-200 bg-white text-brand-700 hover:border-brand-300 hover:bg-brand-50',
      )}
    >
      {label}
    </Link>
  );

  return (
    <nav aria-label="Kategori filtreleri" className="flex flex-wrap gap-2">
      {chip('Tümü', base, active === null)}
      {ARTICLE_CATEGORIES.map((cat) =>
        chip(ARTICLE_CATEGORY_LABELS[cat], `${base}/kategori/${cat}`, active === cat),
      )}
    </nav>
  );
}
