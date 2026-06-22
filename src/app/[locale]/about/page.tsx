import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import Container from '@/components/Container';
import { Button } from '@/components/ui/Button';
import { absUrl } from '@/lib/schema';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'about' });

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: absUrl(`/${locale}/about`),
      languages: {
        tr: absUrl('/tr/about'),
        en: absUrl('/en/about'),
      },
    },
  };
}

export default async function AboutPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'about' });

  return (
    <section>
      <Container className="py-12 md:py-20">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-brand-900 md:text-4xl">
            {t('title')}
          </h1>

          <div className="mt-6 space-y-5 text-base leading-relaxed text-brand-700">
            <p>{t('p1')}</p>
            <p>{t('p2')}</p>
            <p>{t('p3')}</p>
            <p>{t('p4')}</p>
          </div>

          <div className="mt-8">
            <Link href={`/${locale}/therapists`}>
              <Button size="lg">{t('ctaButton')}</Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
