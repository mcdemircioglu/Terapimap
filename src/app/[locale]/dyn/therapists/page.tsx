import type { Metadata } from 'next';
import { generateMetadataImpl, TherapistsPage } from '@/lib/page-views/therapists-index';

// Filtreli / sayfali istekler icin dinamik varyant (middleware rewrite hedefi).
// Dogrudan erisim middleware'de 404'e cevrilir.
export const dynamic = 'force-dynamic';

type Params = { locale: string };
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
  return TherapistsPage({ params, searchParams });
}
