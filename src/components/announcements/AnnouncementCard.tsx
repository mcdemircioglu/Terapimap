/**
 * Duyuru kartı — /duyurular sayfasında kullanılan server component.
 * Blog'un ArticleCard'ından farkı: ayrı bir detay sayfası/slug'ı yok
 * (kullanıcının onayladığı kapsam: "tek bir duyurular + tip filtresi"),
 * bu yüzden tüm bilgi doğrudan kartın içinde gösterilir ve altında
 * "Kayıt Ol" butonu (RegisterButton, client) yer alır.
 */
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import RegisterButton from '@/components/announcements/RegisterButton';
import { ANNOUNCEMENT_TYPE_LABELS } from '@/types/database';
import { getProfessionalUrl } from '@/lib/utils';
import type { PublicAnnouncement } from '@/types/database';

type Props = {
  announcement: PublicAnnouncement;
  locale: string;
};

export default async function AnnouncementCard({ announcement, locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'announcement' });
  const prof = announcement.professional;

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {announcement.image_url && (
        <div className="relative aspect-[16/9] overflow-hidden bg-brand-50">
          <Image
            src={announcement.image_url}
            alt={announcement.title}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <Badge variant="brand">{ANNOUNCEMENT_TYPE_LABELS[announcement.type]}</Badge>
          {announcement.is_online && <Badge variant="accent">{t('online')}</Badge>}
        </div>

        <h3 className="mt-3 text-base font-semibold leading-snug text-brand-900">{announcement.title}</h3>

        {prof && (
          <p className="mt-1 text-xs text-brand-500">
            {t('by')}{' '}
            <a
              href={getProfessionalUrl(prof.slug, prof.professional_type, locale)}
              className="text-brand-600 hover:underline"
            >
              {prof.name}
            </a>
          </p>
        )}

        <p className="mt-2 line-clamp-4 flex-1 whitespace-pre-line text-sm leading-relaxed text-brand-600">
          {announcement.description}
        </p>

        <div className="mt-3 space-y-1 text-xs text-brand-500">
          {announcement.location_text && (
            <p className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {announcement.location_text}
            </p>
          )}
          {announcement.time_label && (
            <p className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {announcement.time_label}
            </p>
          )}
          {announcement.capacity != null && (
            <p className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 0a4 4 0 00-3-3.87" />
              </svg>
              {t('capacityLabel')}: {announcement.capacity}
            </p>
          )}
          {announcement.price_info && (
            <p className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 9v1m0-9c-1.11 0-2.08.402-2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('priceLabel')}: {announcement.price_info}
            </p>
          )}
        </div>

        <div className="mt-4">
          <RegisterButton
            announcementId={announcement.id}
            title={announcement.title}
            label={t('registerCta')}
            subtitle={t('registerSubtitle')}
            closeLabel={t('close')}
          />
        </div>
      </div>
    </Card>
  );
}
