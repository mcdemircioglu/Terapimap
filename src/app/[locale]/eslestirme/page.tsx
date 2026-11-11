/**
 * /[locale]/eslestirme — AI destekli terapist eşleştirme.
 * Sayfa statiktir (searchParams okumaz); kullanıcıya özel iş tarayıcıdan
 * /api/eslestirme'ye giden istekle yapılır, bu yüzden ISR etkilenmez.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { unstable_setRequestLocale } from 'next-intl/server';
import Container from '@/components/Container';
import MatchFinder from '@/components/MatchFinder';
import { absUrl } from '@/lib/schema';
import { brandedTitle, getTherapistsListPath } from '@/lib/utils';

export const revalidate = 3600;

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Metadata {
  const title = 'Sana Uygun Terapisti Bul | Terapimap';
  const description =
    'Yaşadığın sıkıntıyı kendi cümlelerinle anlat, sana uygun psikolog ve terapistleri birlikte bulalım.';
  return {
    title: brandedTitle(title),
    description,
    alternates: { canonical: absUrl(`/${locale}/eslestirme`) },
    // Kişiye özel akış, arama sonuçlarında ince içerik üretmesin.
    robots: { index: false, follow: true },
  };
}

export default function EslestirmePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);

  return (
    <Container className="py-10 md:py-14">
      <nav className="mb-6 text-sm text-brand-600" aria-label="Breadcrumb">
        <Link href={`/${locale}`} className="hover:text-brand-800">
          Ana Sayfa
        </Link>
        <span className="mx-2">·</span>
        <span className="text-brand-800">Eşleştirme</span>
      </nav>

      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-brand-900 md:text-3xl">
          Sana uygun terapisti bulalım
        </h1>
        <p className="mt-2 mb-8 text-sm leading-relaxed text-brand-600 md:text-base">
          Yaşadığın sıkıntıyı ve tercihlerini kendi cümlelerinle yaz. Yapay zekâ, metnini analiz
          edip dizindeki uzmanlar arasından sana en uygun olanları önerir.
        </p>
        <MatchFinder directoryPath={getTherapistsListPath(locale)} />
      </div>
    </Container>
  );
}
