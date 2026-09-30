import type { Metadata } from 'next';
import { generateMetadataImpl, SeoLandingPage } from '@/lib/page-views/seo-landing';

// Filtreli / sayfali istekler icin dinamik varyant (middleware rewrite hedefi).
// Dogrudan erisim middleware'de 404'e cevrilir.
export const dynamic = 'force-dynamic';

type Params = { locale: string; seoSlug: string };
type SP = Record<string, string | undefined>;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SP;
}): Promise<Metadata> {
  return generateMetadataImpl({ params, searchParams });
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SP;
}) {
  return SeoLandingPage({ params, searchParams });
}
