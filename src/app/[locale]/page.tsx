import Link from 'next/link';
import Image from 'next/image';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import Container from '@/components/Container';
import HeroSearch from '@/components/home/HeroSearch';
import TherapistGrid from '@/components/TherapistGrid';
import PopularSearches from '@/components/home/PopularSearches';
import { Button } from '@/components/ui/Button';
import { UsersIcon, MapPinIcon, VideoIcon } from '@/components/ui/icons';
import { getFeaturedTherapists, getSpecialties, getHomeStats } from '@/lib/queries';
import FeaturedArticles from '@/components/guide/FeaturedArticles';

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const [t, specialties, featured, stats] = await Promise.all([
    getTranslations({ locale, namespace: 'home' }),
    getSpecialties(),
    getFeaturedTherapists(6),
    getHomeStats(),
  ]);

  const statItems = [
    { icon: UsersIcon, value: `${stats.totalTherapists}+`, label: t('statTherapists') },
    { icon: VideoIcon, value: String(specialties.length), label: t('statSpecialties') },
    { icon: MapPinIcon, value: String(stats.cityCount), label: t('statCities') },
    { icon: ShieldIcon, value: locale === 'tr' ? 'Ücretsiz' : 'Free', label: locale === 'tr' ? 'Danışan İçin' : 'For clients' },
  ];

  return (
    <>
      {/* Hero — koyu, fotoğraf zeminli */}
      <section className="relative overflow-hidden bg-brand-950">
        {/* Arka plan görseli + koyu scrim */}
        <div className="absolute inset-0">
          <Image
            src="/hero-room.jpg"
            alt=""
            fill
            priority
            unoptimized
            className="object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/92 to-brand-950/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/10 to-brand-950/40" />
        </div>

        <Container className="relative py-16 md:py-24 lg:py-28">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#7ee6cf]">
            Terapimap
          </p>
          <h1 className="mt-4 max-w-2xl font-serif text-4xl leading-[1.1] tracking-tight text-white sm:text-5xl md:text-[3.4rem]">
            {t('heroTitleLead')}{' '}
            <span className="text-[#7ee6cf]">{t('heroTitleEmph')}</span>{' '}
            {t('heroTitleTrail')}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-brand-100/90 md:text-lg">
            {t('heroSubtitleNew')}
          </p>

          {/* Arama */}
          <div className="mt-8">
            <HeroSearch locale={locale} specialties={specialties} />
          </div>

          {/* İstatistik bandı */}
          <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 sm:mt-10 sm:flex sm:flex-wrap sm:gap-x-12">
            {statItems.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-[#7ee6cf] ring-1 ring-white/15">
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <dd className="text-xl font-semibold leading-none text-white">{s.value}</dd>
                  <dt className="mt-1 text-xs text-brand-100/70">{s.label}</dt>
                </div>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* Popüler aramalar */}
      <PopularSearches locale={locale} />

      {/* Öne çıkan terapist yoksa bölüm gizlenir; bu durumda rehber yukarı çıkar */}
      {featured.length > 0 && (
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
      )}

      {/* Psikoloji Rehberi — öne çıkan içerikler (içerik yoksa render edilmez) */}
      <FeaturedArticles locale={locale} />

      {/* Value props */}
      <section>
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
