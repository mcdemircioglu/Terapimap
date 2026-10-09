import type { Metadata } from 'next';
import { getKnownSeoSlugs } from '@/lib/seo-slugs';
import { generateMetadataImpl, SeoLandingPage } from '@/lib/page-views/seo-landing';

// Bu rota searchParams OKUMAZ -> statik/ISR. Filtreli/sayfali istekler
// (?page=, ?online= ...) middleware'de /dyn/... rotasina rewrite edilir.
export const revalidate = 86400; // 24 saat; admin işlemleri etiketle anında temizler
export const dynamicParams = true;

export function generateStaticParams() {
  return getKnownSeoSlugs().map((seoSlug) => ({ seoSlug }));
}

type Params = { locale: string; seoSlug: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return generateMetadataImpl({ params, searchParams: {} });
}

export default async function Page({ params }: { params: Params }) {
  return SeoLandingPage({ params, searchParams: {} });
}
