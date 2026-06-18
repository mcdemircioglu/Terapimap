import { Suspense } from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import Container from './Container';
import Filters from './Filters';
import TherapistGrid from './TherapistGrid';
import Pagination from './Pagination';
import { getDistricts, getSpecialties, getTherapistsPaged } from '@/lib/queries';
import { getCityName } from '@/lib/cities';
import type { ProfessionalType } from '@/types/database';

const PAGE_SIZE = 12;

export default async function TherapistListing({
  locale,
  citySlug,
  specialtySlug,
  searchParams,
}: {
  locale: string;
  citySlug?: string;
  specialtySlug?: string;
  searchParams: {
    online?: string;
    specialty?: string;
    city?: string;
    district?: string;
    type?: string;
    inPerson?: string;
    page?: string;
  };
}) {
  const t = await getTranslations({ locale, namespace: 'list' });

  const effectiveCity = citySlug ?? searchParams.city;
  const effectiveSpecialty = specialtySlug ?? searchParams.specialty;
  const online = searchParams.online === '1';
  const inPerson = searchParams.inPerson === '1';
  const district = searchParams.district || undefined;
  const professionalType = (searchParams.type || undefined) as ProfessionalType | undefined;
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10) || 1);

  const [specialties, districts, { therapists, total }] = await Promise.all([
    getSpecialties(),
    getDistricts(effectiveCity),
    getTherapistsPaged({
      citySlug: effectiveCity,
      specialtySlug: effectiveSpecialty,
      district,
      professionalType,
      online,
      inPerson,
      page,
      pageSize: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const cityName = effectiveCity ? getCityName(effectiveCity) ?? effectiveCity : null;
  const specialty = effectiveSpecialty
    ? specialties.find((s) => s.slug === effectiveSpecialty)
    : null;
  const specialtyName = specialty ? specialty.name : null;

  let title: string;
  if (cityName && specialtyName) {
    title = t('titleCitySpecialty', { city: cityName, specialty: specialtyName });
  } else if (cityName) {
    title = t('titleCity', { city: cityName });
  } else {
    title = t('titleAll');
  }

  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <Container className="py-10 md:py-14">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-brand-900 md:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-brand-600">
          {total > 0
            ? `${total} sonuç${totalPages > 1 ? ` · ${from}–${to} gösteriliyor` : ''}`
            : t('count', { count: 0 })}
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <Filters
          locale={locale}
          specialties={specialties}
          districts={districts}
          selectedCity={effectiveCity}
          selectedSpecialty={effectiveSpecialty}
        />
        <div>
          {therapists.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-12 text-center">
              <svg
                viewBox="0 0 48 48"
                fill="none"
                className="mx-auto mb-4 h-12 w-12 text-brand-300"
                aria-hidden="true"
              >
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M16 24h16M24 16v16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <p className="text-sm font-medium text-brand-700">{t('empty')}</p>
              <Link
                href={'/' + locale + '/therapists'}
                className="mt-3 inline-block text-xs font-medium text-brand-600 underline-offset-2 hover:underline"
              >
                {locale === 'tr' ? 'Filtreleri temizle' : 'Clear filters'}
              </Link>
            </div>
          ) : (
            <>
              <TherapistGrid therapists={therapists} locale={locale} />
              <Suspense>
                <Pagination currentPage={page} totalPages={totalPages} />
              </Suspense>
            </>
          )}
        </div>
      </div>
    </Container>
  );
}
