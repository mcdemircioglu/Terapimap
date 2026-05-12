import Link from 'next/link';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import Container from '@/components/Container';
import SearchBar from '@/components/SearchBar';
import TherapistGrid from '@/components/TherapistGrid';
import { Button } from '@/components/ui/Button';
import { getFeaturedTherapists, getSpecialties } from '@/lib/queries';

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const [t, specialties, featured] = await Promise.all([
    getTranslations({ locale, namespace: 'home' }),
    getSpecialties(),
    getFeaturedTherapists(6),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-brand-200/30 blur-3xl"
        />
        <Container className="relative py-12 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight text-brand-950 sm:text-4xl md:text-5xl">
              {t('heroTitle')}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-brand-700 md:mt-4 md:text-lg">
              {t('heroSubtitle')}
            </p>
          </div>
          <div className="mx-auto mt-6 max-w-3xl md:mt-10">
            <SearchBar locale={locale} specialties={specialties} />
          </div>
        </Container>
      </section>

      {/* Featured therapists */}
      <section>
        <Container className="py-10 md:py-16">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-brand-900 md:text-3xl">
                {t('featuredTitle')}
              </h2>
              <p className="mt-2 text-sm text-brand-700 md:text-base">{t('featuredSubtitle')}</p>
            </div>
            <Link
              href={`/${locale}/therapists`}
              className="hidden shrink-0 text-sm font-medium text-brand-700 hover:text-brand-900 md:inline"
            >
              {t('featuredCta')} →
            </Link>
          </div>
          <div className="mt-6 md:mt-8">
            <TherapistGrid therapists={featured} locale={locale} />
          </div>
          <div className="mt-6 md:hidden">
            <Link href={`/${locale}/therapists`}>
              <Button variant="outline" className="w-full">{t('featuredCta')}</Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* Value props */}
      <section className="bg-brand-50/40">
        <Container className="py-10 md:py-16">
          <h2 className="text-center text-2xl font-semibold text-brand-900 md:text-3xl">
            {t('valueTitle')}
          </h2>
          <div className="mt-6 grid gap-4 md:mt-10 md:grid-cols-3 md:gap-6">
            {[
              { icon: ShieldIcon,  title: t('value1Title'), body: t('value1Body') },
              { icon: SparkleIcon, title: t('value2Title'), body: t('value2Body') },
              { icon: GlobeIcon,   title: t('value3Title'), body: t('value3Body') },
            ].map((v, i) => (
              <div key={i} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-soft md:p-6">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-100 text-brand-700">
                  <v.icon />
                </div>
                <h3 className="mt-4 text-base font-semibold text-brand-900 md:text-lg">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-700">{v.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section>
        <Container className="py-10 md:py-16">
          <div className="rounded-3xl bg-brand-700 p-7 text-center text-white sm:p-10 md:p-14">
            <h2 className="text-2xl font-semibold md:text-3xl">{t('ctaTitle')}</h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-100">{t('ctaBody')}</p>
            <div className="mt-6 md:mt-8">
              <Link href={`/${locale}/therapists`}>
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  {t('ctaButton')}
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M5 12H1M23 12h-4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
    </svg>
  );
}
