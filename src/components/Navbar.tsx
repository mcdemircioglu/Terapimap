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

  const navItems = [
    { href: home,        label: t('home') },
    { href: therapists,  label: t('therapists') },
    { href: therapists,  label: t('about') },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-brand-100 bg-white/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href={home} className="flex items-center gap-2">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s-7-4.5-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-7 10-7 10" transform="translate(-2 0)" />
            </svg>
          </span>
          <span className="text-base font-semibold text-brand-900">{tMeta('siteName')}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href={home}       className="text-brand-700 hover:text-brand-900">{t('home')}</Link>
          <Link href={therapists} className="text-brand-700 hover:text-brand-900">{t('therapists')}</Link>
          <Link href={therapists} className="text-brand-700 hover:text-brand-900">{t('about')}</Link>
        </nav>

        {/* Right side: locale switcher + mobile hamburger */}
        <div className="flex items-center gap-2">
          <LocaleSwitcher current={locale} />
          <MobileMenu items={navItems} />
        </div>
      </Container>
    </header>
  );
}
