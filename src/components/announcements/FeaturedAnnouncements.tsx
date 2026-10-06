/**
 * Ana sayfa "Duyurular" bölümü — server component. FeaturedArticles ile
 * aynı desen: en yeni 3 yayınlanmış duyuruyu gösterir, hiç yayınlanmış
 * duyuru yoksa bölüm hiç render edilmez.
 */
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import Container from '@/components/Container';
import AnnouncementCard from '@/components/announcements/AnnouncementCard';
import { getPublishedAnnouncements } from '@/lib/announcements';

type Props = {
  locale: string;
};

export default async function FeaturedAnnouncements({ locale }: Props) {
  const announcements = (await getPublishedAnnouncements()).slice(0, 3);
  if (announcements.length === 0) return null;

  const t = await getTranslations({ locale, namespace: 'announcement' });

  return (
    <section className="bg-brand-50/40">
      <Container className="py-14 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-brand-900">{t('pageTitle')}</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-brand-600">{t('pageDescription')}</p>
          </div>
          <Link
            href={`/${locale}/duyurular`}
            className="text-sm font-medium text-brand-600 hover:text-brand-800 hover:underline"
          >
            {t('viewAll')} →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} locale={locale} />
          ))}
        </div>
      </Container>
    </section>
  );
}
