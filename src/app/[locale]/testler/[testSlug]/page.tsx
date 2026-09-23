/**
 * /[locale]/testler/[testSlug] — tekil psikoloji testi sayfası.
 * Sadece is_published=true testler için statik param üretir/render eder.
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { unstable_setRequestLocale } from 'next-intl/server';
import Container from '@/components/Container';
import JsonLd from '@/components/JsonLd';
import TestRunner from '@/components/tests/TestRunner';
import { getTestBySlug, getKnownTestSlugs } from '@/lib/queries';
import { absUrl, buildBreadcrumbSchema } from '@/lib/schema';

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getKnownTestSlugs();
  return slugs.map((testSlug) => ({ testSlug }));
}

export async function generateMetadata({
  params: { locale, testSlug },
}: {
  params: { locale: string; testSlug: string };
}): Promise<Metadata> {
  const test = await getTestBySlug(testSlug);
  if (!test) return {};

  const tr = locale === 'tr';
  const title = tr
    ? `${test.title_tr} — Ücretsiz Öz-Değerlendirme | Terapimap`
    : `${test.title_en ?? test.title_tr} | Terapimap`;
  const description =
    test.intro_tr ??
    (tr ? `${test.title_tr} — ücretsiz kısa öz-değerlendirme testi.` : `${test.title_tr} — a free short self-assessment.`);
  const url = absUrl(`/${locale}/testler/${testSlug}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: tr, follow: true },
    openGraph: { title, description, type: 'website', url },
  };
}

export default async function TestPage({
  params: { locale, testSlug },
}: {
  params: { locale: string; testSlug: string };
}) {
  unstable_setRequestLocale(locale);
  const test = await getTestBySlug(testSlug);
  if (!test) notFound();

  const tr = locale === 'tr';
  const homeLabel = tr ? 'Ana Sayfa' : 'Home';

  const breadcrumb = buildBreadcrumbSchema([
    { name: homeLabel, url: absUrl(`/${locale}`) },
    { name: tr ? 'Testler' : 'Tests', url: absUrl(`/${locale}/testler`) },
    { name: test.title_tr, url: absUrl(`/${locale}/testler/${testSlug}`) },
  ]);

  return (
    <Container className="py-10 md:py-14">
      <JsonLd schema={breadcrumb} />
      <nav className="mb-6 text-sm text-brand-600" aria-label="Breadcrumb">
        <Link href={`/${locale}`} className="hover:text-brand-800">{homeLabel}</Link>
        <span className="mx-2">·</span>
        <Link href={`/${locale}/testler`} className="hover:text-brand-800">{tr ? 'Testler' : 'Tests'}</Link>
        <span className="mx-2">·</span>
        <span className="text-brand-900">{test.title_tr}</span>
      </nav>

      <div className="mx-auto max-w-xl">
        <TestRunner test={test} locale={locale} />
      </div>
    </Container>
  );
}
