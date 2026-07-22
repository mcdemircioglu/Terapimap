/**
 * Popüler aramalar — ana sayfada hero altında ikonlu chip'ler.
 * Her chip mevcut bir uzmanlık/landing sayfasına linkler (iç linkleme + SEO).
 * Server component; yeni route üretmez.
 */
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import Container from '@/components/Container';
import {
  CloudIcon,
  EyeIcon,
  HeartIcon,
  SmileIcon,
  UsersIcon,
  VideoIcon,
  ArrowUpRightIcon,
  type IconProps,
} from '@/components/ui/icons';

type Item = { label: string; href: string; Icon: (p: IconProps) => JSX.Element };

export default async function PopularSearches({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'home' });

  const items: Item[] = [
    { label: 'Anksiyete', href: `/${locale}/anksiyete`, Icon: CloudIcon },
    { label: 'Depresyon', href: `/${locale}/depresyon`, Icon: SmileIcon },
    { label: 'Çift Terapisi', href: `/${locale}/cift-terapisi`, Icon: HeartIcon },
    { label: 'Çocuk Psikolojisi', href: `/${locale}/cocuk-psikolojisi`, Icon: UsersIcon },
    { label: 'EMDR', href: `/${locale}/emdr`, Icon: EyeIcon },
    { label: 'Online Terapi', href: `/${locale}/online-terapi`, Icon: VideoIcon },
    { label: 'Sosyal Kaygı', href: `/${locale}/sosyal-kaygi`, Icon: UsersIcon },
  ];

  return (
    <section className="border-b border-brand-100 bg-white">
      <Container className="py-6 md:py-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-brand-800">{t('popularTitle')}</h2>
          <Link
            href={`/${locale}/therapists`}
            className="hidden shrink-0 items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-800 sm:inline-flex"
          >
            {t('popularSeeAll')}
            <ArrowUpRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {items.map(({ label, href, Icon }) => (
            <Link
              key={href}
              href={href}
              className="group inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-900"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-500 transition-colors group-hover:bg-brand-100 group-hover:text-brand-600">
                <Icon className="h-4 w-4" />
              </span>
              {label}
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
