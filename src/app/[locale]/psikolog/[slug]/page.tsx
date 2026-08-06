/**
 * /[locale]/psikolog/[slug]  — canonical profil sayfası
 *
 * Tüm internal linkler buraya işaret eder.
 * /[locale]/therapist/[slug] buraya 301 redirect yapar.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import Container from '@/components/Container';
import LeadForm from '@/components/LeadForm';
import JsonLd from '@/components/JsonLd';
import LocationCard from '@/components/therapist/LocationCard';
import MeetingInfoCard from '@/components/therapist/MeetingInfoCard';
import NearbyTherapistLinks from '@/components/therapist/NearbyTherapistLinks';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { GlobeIcon } from '@/components/ui/icons';
import Avatar from '@/components/ui/Avatar';
import { getTherapistBySlug } from '@/lib/queries';
import { getCitySlug } from '@/lib/cities';
import { getResolvedMapsData } from '@/lib/maps';
import { absUrl, buildTherapistSchema, buildBreadcrumbSchema } from '@/lib/schema';
import { groupSpecialties, SPECIALTY_TYPE_LABELS } from '@/types/database';

// ISR: sayfa saatte bir yenilenir (Fluid CPU tasarrufu).
export const revalidate = 3600;

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const therapist = await getTherapistBySlug(slug);
  if (!therapist) return {};

  const specialties = therapist.specialties.map((s) => s.name).join(', ');
  const location = [therapist.city, therapist.district].filter(Boolean).join(' ');
  const url = absUrl('/' + locale + '/psikolog/' + slug);

  const title = [
    therapist.name,
    [therapist.title, location].filter(Boolean).join(' '),
    'Terapimap',
  ].join(' | ');

  const description = therapist.about
    ? therapist.about.slice(0, 155)
    : `${therapist.name}, ${location} uzman ${therapist.title ?? 'psikolog'}. Uzmanlık alanları: ${specialties}. Terapimap üzerinden iletişime geçin.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    // OG görseli: dosya bazlı opengraph-image.tsx (logo temalı) kullanılır
    openGraph: {
      title: therapist.name + ' — ' + location,
      description,
      type: 'profile',
      url,
    },
  };
}

export default async function PsikologDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  unstable_setRequestLocale(locale);
  const [therapist, t, tDetail, tLead, tNav] = await Promise.all([
    getTherapistBySlug(slug),
    getTranslations({ locale, namespace: 'card' }),
    getTranslations({ locale, namespace: 'detail' }),
    getTranslations({ locale, namespace: 'lead' }),
    getTranslations({ locale, namespace: 'nav' }),
  ]);

  if (!therapist) notFound();

  const citySlug = getCitySlug(therapist.city) ?? therapist.city.toLowerCase();
  const pageUrl = absUrl('/' + locale + '/psikolog/' + therapist.slug);

  // google_maps_url'i bir kez çözümle (kısa link genişletme + place_id
  // sayfasından koordinat kazıma; sonuç 30 gün cache'lenir) — hem JSON-LD
  // geo hem de Konum kartındaki embed bundan beslenir.
  const resolvedMaps =
    therapist.is_in_person && therapist.google_maps_url
      ? await getResolvedMapsData(therapist.google_maps_url)
      : null;

  const breadcrumbLabel =
    locale === 'tr'
      ? { home: 'Ana Sayfa', therapists: 'Terapistler' }
      : { home: 'Home', therapists: 'Therapists' };

  const schemas = [
    buildTherapistSchema(therapist, locale, resolvedMaps),
    buildBreadcrumbSchema([
      { name: breadcrumbLabel.home, url: absUrl('/' + locale) },
      { name: breadcrumbLabel.therapists, url: absUrl('/' + locale + '/therapists') },
      { name: therapist.city, url: absUrl('/' + locale + '/therapists/' + citySlug) },
      { name: therapist.name, url: pageUrl },
    ]),
  ];

  return (
    <>
      <JsonLd schema={schemas} />
      <Container className="py-10 md:py-14">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-brand-600" aria-label="Breadcrumb">
          <Link href={'/' + locale + '/therapists'} className="hover:text-brand-800">
            {tNav('therapists')}
          </Link>
          <span className="mx-2">·</span>
          <Link href={'/' + locale + '/therapists/' + citySlug} className="hover:text-brand-800">
            {therapist.city}
          </Link>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Profil */}
          <div className="space-y-6">
            <Card className="p-6 md:p-8">
              <div className="flex items-start gap-5">
                <Avatar
                  name={therapist.name}
                  slug={therapist.slug}
                  photoUrl={therapist.image_url}
                  size="xl"
                  verified={therapist.is_verified}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <h1 className="text-2xl font-semibold text-brand-900 md:text-3xl">
                      {therapist.name}
                    </h1>
                    {therapist.is_verified && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-medium border border-brand-200 flex-shrink-0 mt-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Doğrulanmış Uzman
                      </span>
                    )}
                  </div>
                  {therapist.title && (
                    <p className="mt-1 text-sm text-brand-600">{therapist.title}</p>
                  )}
                  <p className="mt-2 text-sm text-brand-700">
                    {therapist.city}
                    {therapist.district ? ' · ' + therapist.district : ''}
                    {therapist.clinic_name ? ' · ' + therapist.clinic_name : ''}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {therapist.is_online && <Badge variant="accent">{t('online')}</Badge>}
                    {therapist.is_in_person && <Badge variant="default">{t('inPerson')}</Badge>}
                    {therapist.experience_years > 0 && (
                      <Badge variant="soft">{t('experience', { years: therapist.experience_years })}</Badge>
                    )}
                  </div>
                </div>
              </div>

              {therapist.specialties.length > 0 && (
                <section className="mt-8">
                  <h2 className="text-lg font-semibold text-brand-900">{tDetail('specialties')}</h2>
                  {/* Uzmanlıklar tipe göre gruplanır: konu / yöntem / danışan grubu */}
                  <div className="mt-4 space-y-4">
                    {groupSpecialties(therapist.specialties).map((group) => (
                      <div key={group.type}>
                        <p className="text-xs font-medium uppercase tracking-wide text-brand-500">
                          {SPECIALTY_TYPE_LABELS[group.type].profile}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {group.items.map((s) => (
                            <Link
                              key={s.id}
                              href={'/' + locale + '/therapists/' + citySlug + '/' + s.slug}
                            >
                              <Badge
                                variant={
                                  group.type === 'yontem'
                                    ? 'accent'
                                    : group.type === 'kitle'
                                    ? 'soft'
                                    : 'brand'
                                }
                                className="cursor-pointer hover:opacity-80"
                              >
                                {s.name}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {therapist.about && (
                <section className="mt-8">
                  <h2 className="text-lg font-semibold text-brand-900">{tDetail('about')}</h2>
                  <p className="mt-3 whitespace-pre-line leading-relaxed text-brand-800">
                    {therapist.about}
                  </p>
                </section>
              )}
            </Card>

            {/* 📍 Konum — sadece yüz yüze görüşen uzmanlar için */}
            <LocationCard therapist={therapist} locale={locale} resolvedMaps={resolvedMaps} />

            {/* 🩺 Görüşme Bilgileri */}
            <MeetingInfoCard therapist={therapist} locale={locale} />

            {/* Yakındaki Terapistler — internal linking */}
            <NearbyTherapistLinks therapist={therapist} locale={locale} />

            {/* Bu profil size mi ait? — belirgin doğrulama kartı */}
            <Link
              href={`/profil-dogrula/${therapist.id}`}
              className="group flex items-center gap-4 rounded-2xl border-2 border-brand-200 bg-brand-50 p-5 transition-colors hover:border-brand-400 hover:bg-brand-100/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 md:p-6"
            >
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm md:h-14 md:w-14">
                <svg className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold text-brand-900 md:text-xl">Bu profil size mi ait?</p>
                <p className="mt-1 text-sm leading-relaxed text-brand-700 md:text-base">
                  Profilinizi <strong>ücretsiz</strong> doğrulayın; bilgilerinizi güncelleyin ve
                  &quot;Doğrulanmış Profil&quot; rozeti kazanın.
                </p>
              </div>
              <span className="hidden flex-shrink-0 items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors group-hover:bg-brand-700 sm:inline-flex">
                Doğrula
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>

            {therapist.website_url && (
              <a
                href={therapist.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-1 text-sm text-gray-400 transition-colors hover:text-brand-600"
              >
                <GlobeIcon className="h-4 w-4 flex-shrink-0" />
                {tDetail('visitWebsite')}
              </a>
            )}
          </div>

          {/* Lead form */}
          <aside>
            <Card className="p-6 md:sticky md:top-24">
              <h2 className="text-lg font-semibold text-brand-900">{tLead('title')}</h2>
              <p className="mt-1 text-sm text-brand-600">{tLead('subtitle')}</p>
              <div className="mt-5">
                <LeadForm professionalId={therapist.id} />
              </div>
            </Card>
          </aside>
        </div>
      </Container>
    </>
  );
}
