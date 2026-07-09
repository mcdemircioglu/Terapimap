import Link from 'next/link';

export type BreadcrumbItem = { label: string; href?: string };

/**
 * Şehir / şehir+uzmanlık landing sayfalarının üst bölümü:
 * breadcrumb, H1, kısa açıklama, sayaçlar ve CTA.
 * Server component — JS yükü yok, CLS üretmez.
 */
export default function SeoLandingHeader({
  breadcrumbs,
  h1,
  intro,
  total,
  onlineCount,
  inPersonCount,
  ctaHref,
  ctaLabel,
}: {
  breadcrumbs: BreadcrumbItem[];
  h1: string;
  intro: string;
  total: number;
  onlineCount: number;
  inPersonCount: number;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <header className="mb-8">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-brand-500">
          {breadcrumbs.map((bc, i) => (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true">›</span>}
              {bc.href ? (
                <Link href={bc.href} className="hover:text-brand-800 hover:underline">
                  {bc.label}
                </Link>
              ) : (
                <span className="font-medium text-brand-700">{bc.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <h1 className="text-2xl font-semibold text-brand-900 md:text-3xl">{h1}</h1>

      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-brand-700">{intro}</p>

      {/* Sayaçlar + CTA */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 font-medium text-brand-700">
            {total} uzman
          </span>
          {onlineCount > 0 && (
            <span className="rounded-full border border-brand-200 bg-white px-3 py-1 text-brand-700">
              {onlineCount} online görüşme
            </span>
          )}
          {inPersonCount > 0 && (
            <span className="rounded-full border border-brand-200 bg-white px-3 py-1 text-brand-700">
              {inPersonCount} yüz yüze görüşme
            </span>
          )}
        </div>
        <Link
          href={ctaHref}
          className="inline-flex items-center rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
        >
          {ctaLabel}
        </Link>
      </div>
    </header>
  );
}
