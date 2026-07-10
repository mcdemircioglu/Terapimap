/**
 * 🩺 Görüşme Bilgileri kartı — server component.
 * Düz metin yerine bilgi kartı: görüşme türleri onay işaretli satırlar,
 * deneyim/ücret özet kutuları ve website / Instagram butonları.
 */
import { getTranslations } from 'next-intl/server';
import { Card } from '@/components/ui/Card';
import {
  CheckIcon,
  ExternalLinkIcon,
  GlobeIcon,
  InstagramIcon,
  MapPinIcon,
  StethoscopeIcon,
  VideoIcon,
} from '@/components/ui/icons';
import type { ProfessionalWithSpecialties } from '@/types/database';

type Props = {
  therapist: ProfessionalWithSpecialties;
  locale: string;
};

export default async function MeetingInfoCard({ therapist, locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'detail' });

  const sessionTypes = [
    ...(therapist.is_online
      ? [{ key: 'online', label: t('onlineTherapy'), hint: t('onlineTherapyHint'), icon: VideoIcon }]
      : []),
    ...(therapist.is_in_person
      ? [{ key: 'inPerson', label: t('inPersonTherapy'), hint: t('inPersonTherapyHint'), icon: MapPinIcon }]
      : []),
  ];

  const facts: { label: string; value: string }[] = [];
  if (therapist.experience_years > 0) {
    facts.push({ label: t('experience'), value: t('experienceYears', { years: therapist.experience_years }) });
  }
  if (therapist.price_range && therapist.price_range !== '-') {
    facts.push({ label: t('price'), value: therapist.price_range });
  }

  const hasLinks = Boolean(therapist.website_url || therapist.instagram_url);
  if (sessionTypes.length === 0 && facts.length === 0 && !hasLinks) return null;

  return (
    <Card className="p-6 md:p-8">
      <h2 className="flex items-center gap-2.5 text-lg font-semibold text-brand-900">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <StethoscopeIcon className="h-[18px] w-[18px]" />
        </span>
        {t('meetingInfo')}
      </h2>

      {/* Görüşme türleri */}
      {sessionTypes.length > 0 && (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {sessionTypes.map((session) => (
            <li
              key={session.key}
              className="flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/50 p-4"
            >
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-800">
                <CheckIcon className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-900">{session.label}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-brand-600">
                  <session.icon className="h-3.5 w-3.5 flex-shrink-0" />
                  {session.hint}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Deneyim / ücret */}
      {facts.length > 0 && (
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          {facts.map((fact) => (
            <div key={fact.label} className="rounded-xl bg-brand-50/50 p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-brand-600">
                {fact.label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-brand-900">{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* Website / Instagram */}
      {hasLinks && (
        <div className="mt-6 flex flex-col gap-3 border-t border-brand-100 pt-6 sm:flex-row">
          {therapist.website_url && (
            <a
              href={therapist.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white px-4 text-sm font-medium text-brand-800 transition-colors hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              <GlobeIcon className="h-4 w-4 text-brand-500" />
              {t('visitWebsite')}
              <ExternalLinkIcon className="h-3.5 w-3.5 text-brand-400" />
            </a>
          )}
          {therapist.instagram_url && (
            <a
              href={therapist.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white px-4 text-sm font-medium text-brand-800 transition-colors hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              <InstagramIcon className="h-4 w-4 text-brand-500" />
              Instagram
              <ExternalLinkIcon className="h-3.5 w-3.5 text-brand-400" />
            </a>
          )}
        </div>
      )}
    </Card>
  );
}
