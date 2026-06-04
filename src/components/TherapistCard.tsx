'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import Avatar from './ui/Avatar';
import type { ProfessionalWithSpecialties } from '@/types/database';
import { PROFESSIONAL_TYPE_LABELS } from '@/types/database';

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
          <h3 className="truncate text-base font-semibold text-brand-900">
            {therapist.name}
          </h3>
          <p className="truncate text-xs text-brand-600">
            {therapist.professional_type
              ? PROFESSIONAL_TYPE_LABELS[therapist.professional_type]
              : therapist.title}
          </p>
          <p className="mt-1 text-sm text-brand-700">
            {therapist.city}
            {therapist.district ? ` · ${therapist.district}` : ''}
          </p>
        </div>
        {therapist.rating > 0 && (
          <span className="flex items-center gap-1 text-sm font-medium text-brand-800">
            <svg viewBox="0 0 20 20" className="h-4 w-4 text-amber-500" fill="currentColor">
              <path d="M10 1.5l2.6 5.27 5.82.85-4.21 4.1.99 5.79L10 14.77l-5.2 2.74.99-5.79L1.58 7.62l5.82-.85L10 1.5z" />
            </svg>
            {therapist.rating.toFixed(1)}
          </span>
        )}
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
        <Badge variant="soft">{t('experience', { years: therapist.experience_years })}</Badge>
        {therapist.price_range && (
          <Badge variant="soft">{therapist.price_range}</Badge>
        )}
      </div>

      <div className="mt-auto pt-5">
        <Link href={"/" + locale + "/therapist/" + therapist.slug}>
          <Button variant="outline" className="w-full">
            {t('viewProfile')}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
