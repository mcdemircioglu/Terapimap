import type { Metadata } from 'next';
import { generateMetadataImpl, TherapistsPage } from '@/lib/page-views/therapists-index';

// Bu rota searchParams OKUMAZ -> statik/ISR. Filtreli/sayfali istekler
// (?page=, ?online= ...) middleware'de /dyn/... rotasina rewrite edilir.
export const revalidate = 86400; // 24 saat; admin işlemleri etiketle anında temizler
export const dynamicParams = true;

type Params = { locale: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return generateMetadataImpl({ params, searchParams: {} });
}

export default async function Page({ params }: { params: Params }) {
  return TherapistsPage({ params, searchParams: {} });
}
