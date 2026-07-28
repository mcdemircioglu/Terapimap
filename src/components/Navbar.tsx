import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import Container from './Container';
import LocaleSwitcher from './LocaleSwitcher';
import MobileMenu from './MobileMenu';
import type { Locale } from '@/i18n';

export default async function Navbar({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'nav' });
  const tMeta = await getTranslations({ locale, namespace: 'meta' });

  const home = `/${locale}`;
  const therapists = `/${locale}/therapists`;
  const guide = `/${locale}/psikoloji-rehberi`;
  const about = `/${locale}/about`;
  const applyExpert = `/${locale}/uzman-basvuru`;

  const navItems = [
    { href: home,        label: t('home') },
    { href: therapists,  label: t('therapists') },
    { href: guide,       label: t('guide') },
    { href: about,       label: t('about') },
    { href: applyExpert, label: t('applyExpert') },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-brand-100 bg-white/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href={home} className="flex items-center gap-2">
          <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden="true">
            <path fill="#316c6f" d="M32 4C19 4 8.5 14.5 8.5 27.5 8.5 44 24 53 30.2 61.2c.9 1.2 2.7 1.2 3.6 0C40 53 55.5 44 55.5 27.5 55.5 14.5 45 4 32 4z" />
            <path fill="#ffffff" d="M32 38.5c-.5 0-1-.2-1.4-.5-4.7-3.9-9.1-7-9.1-12 0-3.4 2.7-6 6-6 2 0 3.6 1 4.5 2.5.9-1.5 2.5-2.5 4.5-2.5 3.3 0 6 2.6 6 6 0 5-4.4 8.1-9.1 12-.4.3-.9.5-1.4.5z" />
          </svg>
          <span className="text-base font-semibold text-brand-900">{tMeta('siteName')}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href={home}       className="text-brand-700 hover:text-brand-900">{t('home')}</Link>
          <Link href={therapists} className="text-brand-700 hover:text-brand-900">{t('therapists')}</Link>
          <Link href={guide}      className="text-brand-700 hover:text-brand-900">{t('guide')}</Link>
          <Link href={about}      className="text-brand-700 hover:text-brand-900">{t('about')}</Link>
        </nav>

        {/* Right side: CTA + locale switcher + mobile hamburger */}
        <div className="flex items-center gap-2">
          <Link
            href={applyExpert}
            className="hidden rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 md:inline-flex"
          >
            {t('applyExpert')}
          </Link>
          <LocaleSwitcher current={locale} />
          <MobileMenu items={navItems} />
        </div>
      </Container>
    </header>
  );
}
