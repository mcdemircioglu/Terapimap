'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import Avatar from './ui/Avatar';
import type { ProfessionalWithSpecialties } from '@/types/database';
import { PROFESSIONAL_TYPE_LABELS } from '@/types/database';
import { getProfessionalUrl } from '@/lib/utils';

export default function TherapistCard({
  therapist,
  locale,
}: {
  therapist: ProfessionalWithSpecialties;
  locale: string;
}) {
  const t = useTranslations('card');

  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-start gap-4">
        <Avatar
          name={therapist.name}
          slug={therapist.slug}
          photoUrl={therapist.image_url}
          size="md"
        />
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

      <div className="mt-4 flex flex-wrap gap-1.5">
        {therapist.specialties.slice(0, 3).map((s) => (
          <Badge key={s.id} variant="brand">
            {s.name}
          </Badge>
        ))}
        {therapist.specialties.length > 3 && (
          <Badge variant="soft">+{therapist.specialties.length - 3}</Badge>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        {therapist.is_online && <Badge variant="accent">{t('online')}</Badge>}
        {therapist.is_in_person && <Badge variant="default">{t('inPerson')}</Badge>}
        {therapist.experience_years > 0 && (
          <Badge variant="soft">{t('experience', { years: therapist.experience_years })}</Badge>
        )}
        {therapist.price_range && therapist.price_range !== '-' && (
          <Badge variant="soft">{therapist.price_range}</Badge>
        )}
      </div>

      <div className="mt-auto pt-5">
        <Link href={getProfessionalUrl(therapist.slug, therapist.professional_type, locale)}>
          <Button variant="outline" className="w-full">
            {t('viewProfile')}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
