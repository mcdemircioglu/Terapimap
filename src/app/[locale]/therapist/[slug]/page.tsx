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
import {
  absUrl,
  buildTherapistSchema,
  buildBreadcrumbSchema,
} from '@/lib/schema';

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const therapist = await getTherapistBySlug(slug);
  if (!therapist) return {};
  const t = await getTranslations({ locale, namespace: 'meta' });

  const specialties = therapist.specialties.map((s) => s.name).join(', ');
  const url = absUrl('/' + locale + '/therapist/' + slug);

  return {
    title: therapist.name + ' — ' + (therapist.title ?? t('siteName')),
    description:
      therapist.about ?? therapist.name + ', ' + therapist.city + '. ' + specialties,
    alternates: {
      canonical: url,
      languages: {
        tr: absUrl('/tr/therapist/' + slug),
        en: absUrl('/en/therapist/' + slug),
      },
    },
    openGraph: {
      title: therapist.name + ' — ' + therapist.city,
      description: therapist.about ?? specialties,
      type: 'profile',
      url,
      ...(therapist.image_url ? { images: [{ url: therapist.image_url }] } : {}),
    },
  };
}

export default async function TherapistDetailPage({
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
  const pageUrl = absUrl('/' + locale + '/therapist/' + therapist.slug);

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
          <Link
            href={'/' + locale + '/therapists/' + citySlug}
            className="hover:text-brand-800"
          >
            {therapist.city}
          </Link>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Profile */}
          <div>
            <Card className="p-6 md:p-8">
              <div className="flex items-start gap-5">
                <Avatar
                  name={therapist.name}
                  slug={therapist.slug}
                  photoUrl={therapist.image_url}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-semibold text-brand-900 md:text-3xl">
                    {therapist.name}
                  </h1>
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

              {therapist.about && (
                <section className="mt-8">
                  <h2 className="text-lg font-semibold text-brand-900">{tDetail('about')}</h2>
                  <p className="mt-3 whitespace-pre-line leading-relaxed text-brand-800">
                    {therapist.about}
                  </p>
                </section>
              )}

              {therapist.specialties.length > 0 && (
                <section className="mt-8">
                  <h2 className="text-lg font-semibold text-brand-900">{tDetail('specialties')}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {therapist.specialties.map((s) => (
                      <Link
                        key={s.id}
                        href={'/' + locale + '/therapists/' + citySlug + '/' + s.slug}
                      >
                        <Badge variant="brand" className="cursor-pointer hover:bg-brand-200">
                          {s.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {(() => {
                const sessionValue = [
                  therapist.is_online && tDetail('online'),
                  therapist.is_in_person && tDetail('inPerson'),
                ].filter(Boolean).join(' · ');

                const rows: { label: string; value: string }[] = [];
                if (therapist.experience_years > 0)
                  rows.push({ label: tDetail('experience'), value: therapist.experience_years + ' yil / yrs' });
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
