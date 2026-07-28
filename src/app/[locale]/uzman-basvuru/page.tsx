/**
 * /[locale]/uzman-basvuru — "Uzman Üye Ol" başvuru sayfası.
 * Terapistler kendi bilgilerini girer; başvuru admin onayına düşer.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { unstable_setRequestLocale } from 'next-intl/server';
import Container from '@/components/Container';
import { Card } from '@/components/ui/Card';
import TherapistApplicationForm from '@/components/TherapistApplicationForm';
import { getSpecialties } from '@/lib/queries';
import { absUrl } from '@/lib/schema';

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Metadata {
  const title = 'Uzman Üye Ol | Terapimap';
  const description =
    'Psikolog, klinik psikolog, psikiyatrist ve terapist olarak Terapimap dizinine ücretsiz katılın. Bilgilerinizi girin, onay sonrası profiliniz yayına alınsın.';
  return {
    title,
    description,
    alternates: { canonical: absUrl(`/${locale}/uzman-basvuru`) },
    robots: { index: locale === 'tr', follow: true },
    openGraph: { title, description, type: 'website', url: absUrl(`/${locale}/uzman-basvuru`) },
  };
}

const BENEFITS = [
  'Ücretsiz, doğrulanmış uzman profili',
  'Şehir ve uzmanlık alanına göre keşfedilme',
  'Danışanlardan doğrudan iletişim talebi',
];

export default async function UzmanBasvuruPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const specialties = await getSpecialties();
  const homeLabel = locale === 'tr' ? 'Ana Sayfa' : 'Home';

  return (
    <Container className="py-10 md:py-14">
      <nav className="mb-6 text-sm text-brand-600" aria-label="Breadcrumb">
        <Link href={`/${locale}`} className="hover:text-brand-800">{homeLabel}</Link>
        <span className="mx-2">·</span>
        <span className="text-brand-800">Uzman Üye Ol</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Form */}
        <div className="order-2 lg:order-1">
          <Card className="p-6 md:p-8">
            <h1 className="text-2xl font-semibold text-brand-900 md:text-3xl">Uzman Üye Ol</h1>
            <p className="mt-2 text-sm leading-relaxed text-brand-600">
              Bilgilerinizi girin; başvurunuz ekibimizce incelendikten sonra profiliniz
              Terapimap&apos;te yayına alınır.
            </p>
            <div className="mt-7">
              <TherapistApplicationForm specialtyOptions={specialties} />
            </div>
          </Card>
        </div>

        {/* Yan bilgi */}
        <aside className="order-1 lg:order-2">
          <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-6 lg:sticky lg:top-24">
            <h2 className="text-base font-semibold text-brand-900">Neden Terapimap?</h2>
            <ul className="mt-4 space-y-3">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-brand-700">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
            <p className="mt-5 border-t border-brand-100 pt-4 text-xs leading-relaxed text-brand-500">
              Zaten bir profiliniz var mı? Profil sayfanızdan &quot;Bu profil size mi ait?&quot;
              bağlantısıyla profilinizi doğrulayabilirsiniz.
            </p>
          </div>
        </aside>
      </div>
    </Container>
  );
}
