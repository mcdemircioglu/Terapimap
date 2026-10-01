import type { Metadata } from 'next';
import { CITIES } from '@/lib/cities';
import { generateMetadataImpl, CityPage } from '@/lib/page-views/city';

// Bu rota searchParams OKUMAZ -> statik/ISR. Filtreli/sayfali istekler
// (?page=, ?online= ...) middleware'de /dyn/... rotasina rewrite edilir.
export const revalidate = 21600; // 6 saat; admin işlemleri etiketle anında temizler
export const dynamicParams = true;

export function generateStaticParams() {
  return CITIES.map((c) => ({ city: c.slug }));
}

type Params = { locale: string; city: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return generateMetadataImpl({ params, searchParams: {} });
}

export default async function Page({ params }: { params: Params }) {
  return CityPage({ params, searchParams: {} });
}
