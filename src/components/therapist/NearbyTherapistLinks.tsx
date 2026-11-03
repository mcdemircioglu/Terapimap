/**
 * "Yakındaki Terapistler" — internal linking bloğu.
 * Terapistin şehri/ilçesine göre şehir dizinine (/{locale}/terapistler/{city}),
 * ilçe filtresine ve online terapi sayfasına link üretir. Local SEO + crawl depth iyileştirmesi.
 *
 * Not: eski /{city}-psikolog, /{city}-klinik-psikolog ve /{city}-{meslek} linkleri
 * kaldırıldı. Bu adresler 301 ile /terapistler/{city}'e gidiyordu (bkz. seo-landing.tsx,
 * SEO T5); her profilde aynı hedefe 2-3 link ve bir yönlendirme basamağı oluşturuyordu.
 */
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getCitySlug } from '@/lib/cities';
import { slugifyTr, getTherapistsListPath } from '@/lib/utils';
import { ArrowUpRightIcon, MapPinIcon } from '@/components/ui/icons';
import type { ProfessionalWithSpecialties } from '@/types/database';

type Props = {
  therapist: ProfessionalWithSpecialties;
  locale: string;
};

type InternalLink = { label: string; href: string };

function buildLinks(therapist: ProfessionalWithSpecialties, locale: string): InternalLink[] {
  const citySlug = getCitySlug(therapist.city);
  if (!citySlug) return [];

  const tr = locale === 'tr';
  const city = therapist.city;
  const cityPath = `${getTherapistsListPath(locale)}/${citySlug}`;
  const links: InternalLink[] = [
    {
      label: tr ? `${city} Psikolog ve Terapistleri` : `Therapists in ${city}`,
      href: cityPath,
    },
  ];

  if (therapist.district) {
    links.push({
      label: tr ? `${therapist.district} Psikologları` : `Psychologists in ${therapist.district}`,
      href: `${cityPath}?district=${slugifyTr(therapist.district)}`,
    });
  }

  if (therapist.is_online) {
    links.push({
      label: tr ? 'Online Terapi' : 'Online Therapy',
      href: `/${locale}/online-terapi`,
    });
  }

  return links;
}

export default async function NearbyTherapistLinks({ therapist, locale }: Props) {
  const links = buildLinks(therapist, locale);
  if (links.length === 0) return null;

  const t = await getTranslations({ locale, namespace: 'detail' });

  return (
    <section aria-label={t('nearby')} className="rounded-2xl border border-brand-100 bg-brand-50/40 p-6">
      <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand-700">
        <MapPinIcon className="h-4 w-4 text-brand-500" />
        {t('nearby')}
      </h2>
      <nav className="mt-4 flex flex-wrap gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-900"
          >
            {link.label}
            <ArrowUpRightIcon className="h-3.5 w-3.5 text-brand-400 transition-colors group-hover:text-brand-600" />
          </Link>
        ))}
      </nav>
    </section>
  );
}
