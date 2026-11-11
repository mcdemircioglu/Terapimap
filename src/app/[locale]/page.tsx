import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import Container from '@/components/Container';
import HeroSearch from '@/components/home/HeroSearch';
import HeroMatchBox from '@/components/home/HeroMatchBox';import FeaturedTherapistsSlider from '@/components/home/FeaturedTherapistsSlider';
import PopularSearches from '@/components/home/PopularSearches';
import CityBrowseSection from '@/components/CityBrowseSection';
import FeaturedTests from '@/components/home/FeaturedTests';
import ButtonLink from '@/components/ui/ButtonLink';
import { UsersIcon, MapPinIcon, VideoIcon } from '@/components/ui/icons';
import {
  getCityCountsCached,
  getFeaturedTherapists,
  getSpecialties,
  getHomeStats,
  getPublishedTests,
} from '@/lib/queries';
import { absUrl } from '@/lib/schema';
import { getTherapistsListPath } from '@/lib/utils';
import FeaturedArticles from '@/components/guide/FeaturedArticles';
import FeaturedAnnouncements from '@/components/announcements/FeaturedAnnouncements';

// ISR: sayfa saatte bir yenilenir (Fluid CPU tasarrufu).
export const revalidate = 3600;

// Ana sayfa canonical'ı sitemap ile aynı adres (/tr). Layout'a konmaz: canonical'ı
// olmayan tüm sayfalar ana sayfayı işaret ederdi.
export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return { alternates: { canonical: absUrl(`/${locale}`) } };
}

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const [t, specialties, featured, stats, tests, cityCounts] = await Promise.all([
    getTranslations({ locale, namespace: 'home' }),
    getSpecialties(),
    getFeaturedTherapists(), // limitsiz — tüm öne çıkan terapistler (bkz. queries.ts)
    getHomeStats(),
    getPublishedTests(),
    getCityCountsCached(),
  ]);

  const statItems = [
    { icon: UsersIcon, value: `${stats.totalTherapists}+`, label: t('statTherapists') },
    { icon: VideoIcon, value: String(specialties.length), label: t('statSpecialties') },
    { icon: MapPinIcon, value: String(stats.cityCount), label: t('statCities') },
    { icon: ShieldIcon, value: locale === 'tr' ? 'Doğrulanmış' : 'Verified', label: locale === 'tr' ? 'Profiller' : 'Profiles' },
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
            // Optimize edilmiş sunum (önceden unoptimized: 1920 px JPG olduğu gibi gidiyordu).
            // Mobilde kutu dikey olduğu için ~1200 px genişlik seçtirilir; görsel zaten koyu
            // scrim altında, keskinlik kaybı görünmez.
            sizes="(max-width: 767px) 1200px, 100vw"
            quality={70}
            className="object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/92 to-brand-950/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/10 to-brand-950/40" />
        </div>

        <Container className="relative py-10 sm:py-16 md:py-24 lg:py-28">
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

          {/* AI eşleştirme: arama kutusu görünümlü giriş (metin sessionStorage ile /eslestirme'ye taşınır) */}
          <div className="mt-8">
            <HeroMatchBox matchPath={`/${locale}/eslestirme`} />
          </div>

          {/* Filtreli arama */}
          <p className="mb-3 mt-6 text-xs text-brand-100/70">ya da filtreyle ara</p>
          <div>
            <HeroSearch locale={locale} specialties={specialties} />
          </div>

          {/* İstatistik bandı */}
          {/* <dl> yerine <ul>: her öğede simge + değer + etiket vardı, <dl> içinde <div> yalnızca dt/dd
              içerebilir (Lighthouse "tanım listesi" hatası) ve değer etiketten önce geliyordu. */}
          <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 sm:mt-10 sm:flex sm:flex-wrap sm:gap-x-12 sm:gap-y-5">
            {statItems.map((s) => (
              <li key={s.label} className="flex items-center gap-3">
                <span className="flex h-9 w-9 flex-shrink-0 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/10 text-[#7ee6cf] ring-1 ring-white/15">
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <span className="block text-xl font-semibold leading-none text-white">{s.value}</span>
                  <span className="mt-1 block text-xs text-brand-100/70">{s.label}</span>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Popüler aramalar */}
      <PopularSearches locale={locale} />

      {/* Şehre göre gözat: ana sayfadan şehir sayfalarına gövde içinde link (yalnızca indekslenebilir şehirler) */}
      <CityBrowseSection locale={locale} cityCounts={cityCounts} />

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
                href={`/${locale}/one-cikan-terapistler`}
                className="hidden shrink-0 text-sm font-medium text-brand-700 hover:text-brand-900 md:inline"
              >
                {locale === 'tr' ? 'Öne çıkan terapistler' : 'Featured therapists'} →
              </Link>
            </div>
            <div className="mt-6 md:mt-8">
              <FeaturedTherapistsSlider therapists={featured} locale={locale} />
            </div>
            <div className="mt-6 md:hidden">
              <ButtonLink href={`/${locale}/one-cikan-terapistler`} variant="outline" className="w-full">
                {locale === 'tr' ? 'Öne çıkan terapistler' : 'Featured therapists'}
              </ButtonLink>
            </div>
          </Container>
        </section>
      )}

      {/* Psikoloji Testleri — yayında test yoksa bölüm gizlenir */}
      {tests.length > 0 && (
        <section>
          <Container className="py-10 md:py-16">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-brand-900 md:text-3xl">
                  {t('testsTitle')}
                </h2>
                <p className="mt-2 text-sm text-brand-700 md:text-base">{t('testsSubtitle')}</p>
              </div>
              <Link
                href={`/${locale}/testler`}
                className="hidden shrink-0 text-sm font-medium text-brand-700 hover:text-brand-900 md:inline"
              >
                {t('testsCta')} →
              </Link>
            </div>
            <div className="mt-6 md:mt-8">
              <FeaturedTests tests={tests} locale={locale} />
            </div>
            <div className="mt-6 md:hidden">
              <ButtonLink href={`/${locale}/testler`} variant="outline" className="w-full">
                {t('testsCta')}
              </ButtonLink>
            </div>
          </Container>
        </section>
      )}

      {/* Psikoloji Rehberi — öne çıkan içerikler (içerik yoksa render edilmez) */}
      <FeaturedArticles locale={locale} />

      {/* Duyurular — en yeni 3 yayınlanmış duyuru (hiç yoksa render edilmez) */}
      <FeaturedAnnouncements locale={locale} />

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
              <ButtonLink href={getTherapistsListPath(locale)} size="lg" variant="secondary" className="w-full sm:w-auto">
                {t('ctaButton')}
              </ButtonLink>
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
