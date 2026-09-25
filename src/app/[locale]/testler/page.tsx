/**
 * /[locale]/testler — psikoloji testleri hub sayfası.
 * Yayında olan tüm testleri listeler.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { unstable_setRequestLocale } from 'next-intl/server';
import Container from '@/components/Container';
import { Card } from '@/components/ui/Card';
import JsonLd from '@/components/JsonLd';
import { CloudIcon, HeartIcon, EyeIcon, UsersIcon, SmileIcon } from '@/components/ui/icons';
import { getPublishedTests } from '@/lib/queries';
import type { PsychologyTestListItem } from '@/types/database';
import { absUrl, buildBreadcrumbSchema } from '@/lib/schema';

// Test detay sayfasıyla (`[testSlug]/page.tsx`) aynı revalidate süresi.
// Bunu eklemeden önce bu sayfa varsayılan olarak süresiz statik önbelleğe
// alınıyordu (Next.js'in `revalidate` verilmeyince uyguladığı davranış) —
// bu da dev sunucusunda yeni yayınlanan bir testin listede görünmesi için
// `.next` cache'ini elle silmeyi gerektiriyordu. Artık en geç 1 saatte bir
// kendiliğinden tazeleniyor.
export const revalidate = 3600;

/**
 * `test.cover_image_url` boşken kart üzerinde gösterilecek geçici ikon+pastel
 * fallback'i. Test türüne göre sırayla dağıtılır; bir test için özel bir
 * illüstrasyon hazır olduğunda sadece o testin `cover_image_url` alanını
 * Supabase'den doldurmak yeterli olur — bu bileşende değişiklik gerekmez.
 */
const FALLBACK_ICONS_BY_KIND: Record<PsychologyTestListItem['kind'], Array<typeof CloudIcon>> = {
  clinical: [CloudIcon, HeartIcon, EyeIcon],
  viral: [UsersIcon, SmileIcon, HeartIcon],
};

/** Kart zeminini iki pastel ton arasında sırayla dağıtır (marka renkleriyle uyumlu). */
const CARD_TONES = [
  { cardBg: 'bg-brand-50', badgeBg: 'bg-white/70', badgeText: 'text-brand-600' },
  { cardBg: 'bg-accent-50', badgeBg: 'bg-white/70', badgeText: 'text-accent-600' },
] as const;

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Metadata {
  const tr = locale === 'tr';
  const title = tr ? 'Psikoloji Testleri | Terapimap' : 'Psychology Tests | Terapimap';
  const description = tr
    ? 'Kaygı, depresyon ve daha fazlası için ücretsiz, kısa öz-değerlendirme testleri. Sonuçlarınızı görün, dilerseniz size uygun uzmanları keşfedin.'
    : 'Free, short self-assessment tests for anxiety, depression and more.';
  return {
    title,
    description,
    alternates: { canonical: absUrl(`/${locale}/testler`) },
    robots: { index: tr, follow: true },
    openGraph: { title, description, type: 'website', url: absUrl(`/${locale}/testler`) },
  };
}

export default async function TestlerHubPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const tests = await getPublishedTests();
  const tr = locale === 'tr';
  const homeLabel = tr ? 'Ana Sayfa' : 'Home';

  const breadcrumb = buildBreadcrumbSchema([
    { name: homeLabel, url: absUrl(`/${locale}`) },
    { name: tr ? 'Testler' : 'Tests', url: absUrl(`/${locale}/testler`) },
  ]);

  return (
    <Container className="py-10 md:py-14">
      <JsonLd schema={breadcrumb} />
      <nav className="mb-6 text-sm text-brand-600" aria-label="Breadcrumb">
        <Link href={`/${locale}`} className="hover:text-brand-800">{homeLabel}</Link>
        <span className="mx-2">·</span>
        <span className="text-brand-900">{tr ? 'Testler' : 'Tests'}</span>
      </nav>

      <h1 className="text-3xl font-bold text-brand-900 md:text-4xl">
        {tr ? 'Psikoloji Testleri' : 'Psychology Tests'}
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-brand-700 md:text-base">
        {tr
          ? 'Kısa, ücretsiz öz-değerlendirme testleri. Bu testler bir tanı aracı değildir; sonuçlarınızı bir uzmanla değerlendirmeniz faydalı olabilir.'
          : 'Short, free self-assessment tests. These are not diagnostic tools; discussing your results with a specialist can be helpful.'}
      </p>

      {tests.length === 0 ? (
        <p className="mt-10 text-sm text-brand-500">
          {tr ? 'Şu anda yayında test bulunmuyor.' : 'No tests are published yet.'}
        </p>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((test, i) => {
            const tone = CARD_TONES[i % CARD_TONES.length];
            const FallbackIcon = FALLBACK_ICONS_BY_KIND[test.kind][i % FALLBACK_ICONS_BY_KIND[test.kind].length];
            return (
              <Link key={test.id} href={`/${locale}/testler/${test.slug}`} className="group h-full">
                <Card
                  className={`flex h-full flex-col gap-2.5 border-transparent p-5 transition-shadow hover:shadow-md ${tone.cardBg}`}
                >
                  {test.cover_image_url ? (
                    <img
                      src={test.cover_image_url}
                      alt=""
                      className="mb-1 h-28 w-full rounded-xl object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone.badgeBg} ${tone.badgeText}`}>
                      <FallbackIcon className="h-6 w-6" />
                    </div>
                  )}
                  <div className="text-xs font-semibold uppercase tracking-wide text-brand-800/60">
                    {test.kind === 'clinical' ? (tr ? 'Klinik tarama' : 'Clinical screening') : (tr ? 'Kişilik & ilişki' : 'Personality & relationships')}
                  </div>
                  <h2 className="text-lg font-semibold text-brand-900">{test.title_tr}</h2>
                  {test.intro_tr && (
                    <p className="line-clamp-3 flex-1 text-sm text-brand-800/80">{test.intro_tr}</p>
                  )}
                  <span className="mt-1 inline-flex w-fit items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors group-hover:bg-brand-700">
                    {tr ? 'Teste Başla' : 'Start the test'}
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </Container>
  );
}
