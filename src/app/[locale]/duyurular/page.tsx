/**
 * /[locale]/duyurular — terapist duyuruları (etkinlik / eğitim / iş ilanı)
 * ana liste sayfası (server component). Kullanıcının onayladığı kapsam:
 * TEK bir liste sayfası, ayrı bir detay/slug sayfası yok — tip filtresi
 * ?tip= query param ile aynı URL üzerinde çalışır.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { unstable_setRequestLocale, getTranslations } from 'next-intl/server';
import Container from '@/components/Container';
import JsonLd from '@/components/JsonLd';
import AnnouncementCard from '@/components/announcements/AnnouncementCard';
import { getPublishedAnnouncements } from '@/lib/announcements';
import { absUrl, buildBreadcrumbSchema, buildCollectionPageSchema } from '@/lib/schema';
import { ANNOUNCEMENT_TYPES, ANNOUNCEMENT_TYPE_LABELS } from '@/types/database';
import type { AnnouncementType } from '@/types/database';
import { cn } from '@/lib/utils';

// ISR: sayfa saatte bir yenilenir.
export const revalidate = 3600;

const DESCRIPTION =
  'Terapistlerimizin düzenlediği etkinlikleri, eğitimleri ve iş ilanlarını keşfedin.';

function isAnnouncementType(value: string): value is AnnouncementType {
  return (ANNOUNCEMENT_TYPES as readonly string[]).includes(value);
}

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Metadata {
  const canonical = absUrl(`/${locale}/duyurular`);

  return {
    title: 'Duyurular | Terapimap',
    description: DESCRIPTION,
    alternates: { canonical },
    robots: { index: locale === 'tr', follow: true },
    openGraph: {
      title: 'Duyurular | Terapimap',
      description: DESCRIPTION,
      type: 'website',
      url: canonical,
    },
  };
}

export default async function DuyurularPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { tip?: string };
}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'announcement' });

  const rawType = searchParams.tip;
  const activeType = rawType && isAnnouncementType(rawType) ? rawType : null;

  const announcements = await getPublishedAnnouncements(activeType ? { type: activeType } : undefined);

  const homeLabel = locale === 'tr' ? 'Ana Sayfa' : 'Home';
  const pageUrl = absUrl(`/${locale}/duyurular`);
  const base = `/${locale}/duyurular`;

  const schemas = [
    buildCollectionPageSchema({
      name: t('pageTitle'),
      description: DESCRIPTION,
      url: pageUrl,
      locale,
    }),
    buildBreadcrumbSchema([
      { name: homeLabel, url: absUrl('/' + locale) },
      { name: t('pageTitle'), url: pageUrl },
    ]),
  ];

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
    <>
      <JsonLd schema={schemas} />
      <Container className="py-10 md:py-14">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-brand-600" aria-label="Breadcrumb">
          <Link href={'/' + locale} className="hover:text-brand-800">
            {homeLabel}
          </Link>
          <span className="mx-2">·</span>
          <span className="text-brand-800">{t('pageTitle')}</span>
        </nav>

        <h1 className="text-3xl font-semibold text-brand-900 md:text-4xl">{t('pageTitle')}</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-brand-600">{t('pageDescription')}</p>

        {/* Tip filtreleri */}
        <div className="mt-8 flex flex-wrap gap-2" aria-label="Tip filtreleri">
          {chip(t('filterAll'), base, activeType === null)}
          {ANNOUNCEMENT_TYPES.map((type) =>
            chip(ANNOUNCEMENT_TYPE_LABELS[type], `${base}?tip=${type}`, activeType === type),
          )}
        </div>

        {/* Duyuru kartları */}
        <section className="mt-10">
          {announcements.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {announcements.map((a) => (
                <AnnouncementCard key={a.id} announcement={a} locale={locale} />
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-brand-100 bg-brand-50/50 p-6 text-sm text-brand-600">
              {t('empty')}
            </p>
          )}
        </section>
      </Container>
    </>
  );
}
