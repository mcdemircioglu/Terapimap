/**
 * Ana sayfada "Öne çıkan terapistler" bölümünün altında gösterilen psikoloji
 * testleri grid'i. Kart görünümü `/[locale]/testler` hub sayfasıyla aynıdır
 * (aynı fallback ikon/pastel ton mantığı) — tutarlılık için iki yerde de
 * aynı tasarım korunur.
 */
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { CloudIcon, HeartIcon, EyeIcon, UsersIcon, SmileIcon } from '@/components/ui/icons';
import type { PsychologyTestListItem } from '@/types/database';

const FALLBACK_ICONS_BY_KIND: Record<PsychologyTestListItem['kind'], Array<typeof CloudIcon>> = {
  clinical: [CloudIcon, HeartIcon, EyeIcon],
  viral: [UsersIcon, SmileIcon, HeartIcon],
};

const CARD_TONES = [
  { cardBg: 'bg-brand-50', badgeBg: 'bg-white/70', badgeText: 'text-brand-600' },
  { cardBg: 'bg-accent-50', badgeBg: 'bg-white/70', badgeText: 'text-accent-600' },
] as const;

export default function FeaturedTests({
  tests,
  locale,
}: {
  tests: PsychologyTestListItem[];
  locale: string;
}) {
  if (tests.length === 0) return null;
  const tr = locale === 'tr';

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                {test.kind === 'clinical'
                  ? (tr ? 'Klinik tarama' : 'Clinical screening')
                  : (tr ? 'Kişilik & ilişki' : 'Personality & relationships')}
              </div>
              <h3 className="text-lg font-semibold text-brand-900">{test.title_tr}</h3>
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
  );
}
