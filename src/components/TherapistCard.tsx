'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import Avatar from './ui/Avatar';
import type { ProfessionalWithSpecialties } from '@/types/database';
import { PROFESSIONAL_TYPE_LABELS, groupSpecialties } from '@/types/database';
import { getProfessionalUrl } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';

// Kartta görünen uzmanlık sayısı: mobilde 3, sm ve üstünde 5 (kalanı "+N" rozetine)
const MOBILE_CHIPS = 3;
const DESKTOP_CHIPS = 5;

export default function TherapistCard({
  therapist,
  locale,
}: {
  therapist: ProfessionalWithSpecialties;
  locale: string;
}) {
  const t = useTranslations('card');

  // Önce konular, sonra yöntemler, en son danışan grupları (profil açıklamasıyla aynı sıra):
  // sınırlı yer varken "Ergen, Yetişkin" gibi kitle etiketleri konulardan önce görünmesin.
  const specialties = groupSpecialties(therapist.specialties).flatMap((g) => g.items);
  const total = specialties.length;

  return (
    <Card className="flex h-full flex-col p-4 sm:p-5">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Mobilde 64 px, sm ve üstünde 96 px avatar (liste kartı ~100 px kısalır) */}
        <div className="flex-shrink-0 [&>div]:h-16 [&>div]:w-16 sm:[&>div]:h-24 sm:[&>div]:w-24">
          <Avatar
            name={therapist.name}
            slug={therapist.slug}
            photoUrl={therapist.image_url}
            size="lg"
            verified={therapist.is_verified}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-brand-900 leading-snug">
            {therapist.name}
          </h3>
          <p className="text-xs text-brand-600">
            {therapist.professional_type
              ? PROFESSIONAL_TYPE_LABELS[therapist.professional_type]
              : therapist.title}
          </p>
          <p className="mt-1 text-sm text-brand-700">
            {therapist.city}
            {therapist.district ? ` · ${therapist.district}` : ''}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4">
        {specialties.slice(0, DESKTOP_CHIPS).map((s, i) => (
          <Badge key={s.id} variant="brand" className={i >= MOBILE_CHIPS ? 'hidden sm:inline-flex' : ''}>
            {s.name}
          </Badge>
        ))}
        {total > MOBILE_CHIPS && (
          <Badge variant="soft" className="sm:hidden">
            +{total - MOBILE_CHIPS}
          </Badge>
        )}
        {total > DESKTOP_CHIPS && (
          <Badge variant="soft" className="hidden sm:inline-flex">
            +{total - DESKTOP_CHIPS}
          </Badge>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5 text-xs sm:mt-3">
        {therapist.is_online && <Badge variant="accent">{t('online')}</Badge>}
        {therapist.is_in_person && <Badge variant="default">{t('inPerson')}</Badge>}
        {therapist.experience_years > 0 && (
          <Badge variant="soft">{t('experience', { years: therapist.experience_years })}</Badge>
        )}
        {therapist.price_range && therapist.price_range !== '-' && (
          <Badge variant="soft">{therapist.price_range}</Badge>
        )}
      </div>

      <div className="mt-auto pt-4 sm:pt-5">
        {/* Önceden <Link> içinde <button> vardı (geçersiz iç içe etkileşimli öğe, bağlantı kutusu
            22 px'ti). Tek bir bağlantı olarak, düğme görünümüyle (Button outline md) yazıldı. */}
        <Link
          href={getProfessionalUrl(therapist.slug, therapist.professional_type, locale)}
          onClick={() => trackEvent('profile_card_click')}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-brand-200 bg-white px-4 text-sm font-medium text-brand-800 transition-colors hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          {t('viewProfile')}
        </Link>
      </div>
    </Card>
  );
}
