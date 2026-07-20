import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import {
  getMessages,
  getTranslations,
  unstable_setRequestLocale,
} from 'next-intl/server';
import { notFound } from 'next/navigation';
import '../globals.css';

import Navbar from '@/components/Navbar';
import JsonLd from '@/components/JsonLd';
import { buildOrganizationSchema } from '@/lib/schema';
import Footer from '@/components/Footer';
import { CookieConsentProvider } from '@/components/cookie-consent/CookieConsentProvider';
import CookieBanner from '@/components/cookie-consent/CookieBanner';
import CookiePreferencesModal from '@/components/cookie-consent/CookiePreferencesModal';
import ConsentScripts from '@/components/cookie-consent/ConsentScripts';
import { locales, type Locale } from '@/i18n';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta' });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${t('siteName')} — ${t('tagline')}`,
      template: `%s · ${t('siteName')}`,
    },
    description: t('description'),
    openGraph: {
      title: t('siteName'),
      description: t('description'),
      type: 'website',
      locale: locale === 'tr' ? 'tr_TR' : 'en_US',
    },
    // EN locale: içerik henüz çevrilmediği için tamamen noindex —
    // Türkçe içeriğin duplicate olarak değerlendirilme riskini önler.
    ...(locale !== 'tr' ? { robots: { index: false, follow: true } } : {}),
    icons: {
      icon: [
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      shortcut: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();
  unstable_setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <JsonLd schema={buildOrganizationSchema()} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CookieConsentProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar locale={locale as Locale} />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <CookieBanner />
            <CookiePreferencesModal />
            <ConsentScripts />
          </CookieConsentProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
