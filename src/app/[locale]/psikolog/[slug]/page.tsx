/**
 * /[locale]/psikolog/[slug]  — canonical profil sayfası
 *
 * Tüm internal linkler buraya işaret eder.
 * /[locale]/therapist/[slug] buraya 301 redirect yapar.
 */
import type React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import Container from '@/components/Container';
import LeadForm from '@/components/LeadForm';
import JsonLd from '@/components/JsonLd';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import { getTherapistBySlug } from '@/lib/queries';
import { getCitySlug } from '@/lib/cities';
import { absUrl, buildTherapistSchema, buildBreadcrumbSchema } from '@/lib/schema';

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
    alternates: {
      canonical: url,
      languages: {
        tr: absUrl('/tr/psikolog/' + slug),
        en: absUrl('/en/psikolog/' + slug),
      },
    },
    openGraph: {
      title: therapist.name + ' — ' + location,
      description,
      type: 'profile',
      url,
      ...(therapist.image_url ? { images: [{ url: therapist.image_url }] } : {}),
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

  const breadcrumbLabel =
    locale === 'tr'
      ? { home: 'Ana Sayfa', therapists: 'Terapistler' }
      : { home: 'Home', therapists: 'Therapists' };

  const schemas = [
    buildTherapistSchema(therapist, locale),
    buildBreadcrumbSchema([
      { name: breadcrumbLabel.home, url: absUrl('/' + locale) },
      { name: breadcrumbLabel.therapists, url: absUrl('/' + locale + '/therapists') },
      { name: therapist.city, url: absUrl('/' + locale + '/therapists/' + citySlug) },
      { name: therapist.name, url: pageUrl },
    ]),
  ];

  const links: { label: string; href: string; icon: React.ReactNode }[] = [];

  if (therapist.website_url) {
    links.push({
      label: therapist.website_url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''),
      href: therapist.website_url,
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
        </svg>
      ),
    });
  }

  if (therapist.instagram_url) {
    links.push({
      label: therapist.instagram_url.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, ''),
      href: therapist.instagram_url,
      icon: (
        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
    });
  }

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
          <div>
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
                  <div className="mt-3 flex flex-wrap gap-2">
                    {therapist.specialties.map((s) => (
                      <Link key={s.id} href={'/' + locale + '/therapists/' + citySlug + '/' + s.slug}>
                        <Badge variant="brand" className="cursor-pointer hover:bg-brand-200">
                          {s.name}
                        </Badge>
                      </Link>
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

              {(() => {
                const sessionValue = [
                  therapist.is_online && tDetail('online'),
                  therapist.is_in_person && tDetail('inPerson'),
                ].filter(Boolean).join(' · ');

                const rows: { label: string; value: string }[] = [];
                if (therapist.experience_years > 0)
                  rows.push({ label: tDetail('experience'), value: therapist.experience_years + ' yıl' });
                if (sessionValue)
                  rows.push({ label: tDetail('session'), value: sessionValue });
                if (therapist.price_range && therapist.price_range !== '-')
                  rows.push({ label: tDetail('price'), value: therapist.price_range });

                return rows.length > 0 ? (
                  <section className="mt-8 grid gap-4 sm:grid-cols-3">
                    {rows.map((r) => <InfoRow key={r.label} label={r.label} value={r.value} />)}
                  </section>
                ) : null;
              })()}

              {/* Linkler */}
              {links.length > 0 && (
                <section className="mt-8 flex flex-wrap gap-3">
                  {links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 hover:underline"
                    >
                      {link.icon}
                      {link.label}
                    </a>
                  ))}
                </section>
              )}

              {/* Bu profil size mi ait? */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <Link
                  href={`/profil-dogrula/${therapist.id}`}
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-brand-600 transition-colors group"
                >
                  <svg className="w-4 h-4 flex-shrink-0 group-hover:text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Bu profil size mi ait? Profilinizi doğrulayın
                </Link>
              </div>
            </Card>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-brand-50/50 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-brand-600">{label}</div>
      <div className="mt-1 text-sm text-brand-900">{value}</div>
    </div>
  );
}
