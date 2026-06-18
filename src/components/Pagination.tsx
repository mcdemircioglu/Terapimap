'use client';

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';

function buildPageUrl(pathname: string, params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params.toString());
  if (page === 1) {
    next.delete('page');
  } else {
    next.set('page', String(page));
  }
  const qs = next.toString();
  return qs ? pathname + '?' + qs : pathname;
}

function pageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '…')[] = [1];

  if (current > 3) pages.push('…');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push('…');
  pages.push(total);

  return pages;
}

export default function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const pathname = usePathname();
  const params = useSearchParams();

  if (totalPages <= 1) return null;

  const pages = pageNumbers(currentPage, totalPages);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const baseLink =
    'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-medium transition-colors';
  const active = 'bg-brand-600 text-white';
  const inactive = 'text-brand-700 hover:bg-brand-50 border border-brand-100';
  const disabled = 'text-brand-300 pointer-events-none border border-brand-100';
  const ellipsis = 'inline-flex h-9 min-w-9 items-center justify-center text-sm text-brand-400';

  return (
    <nav
      aria-label="Sayfalama"
      className="mt-10 flex items-center justify-center gap-1.5 flex-wrap"
    >
      {/* Önceki */}
      {hasPrev ? (
        <Link
          href={buildPageUrl(pathname, params, currentPage - 1)}
          className={`${baseLink} ${inactive} gap-1`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Önceki
        </Link>
      ) : (
        <span className={`${baseLink} ${disabled} gap-1`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Önceki
        </span>
      )}

      {/* Sayfa numaraları */}
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className={ellipsis}>…</span>
        ) : (
          <Link
            key={p}
            href={buildPageUrl(pathname, params, p)}
            aria-current={p === currentPage ? 'page' : undefined}
            className={`${baseLink} ${p === currentPage ? active : inactive}`}
          >
            {p}
          </Link>
        )
      )}

      {/* Sonraki */}
      {hasNext ? (
        <Link
          href={buildPageUrl(pathname, params, currentPage + 1)}
          className={`${baseLink} ${inactive} gap-1`}
        >
          Sonraki
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ) : (
        <span className={`${baseLink} ${disabled} gap-1`}>
          Sonraki
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      )}
    </nav>
  );
}
