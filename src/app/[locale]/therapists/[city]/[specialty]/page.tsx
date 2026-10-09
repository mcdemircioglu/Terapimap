import type { Metadata } from 'next';
import { generateMetadataImpl, CitySpecialtyPage } from '@/lib/page-views/city-specialty';

// Bu rota searchParams OKUMAZ -> statik/ISR. Filtreli/sayfali istekler
// (?page=, ?online= ...) middleware'de /dyn/... rotasina rewrite edilir.
export const revalidate = 86400; // 24 saat; admin işlemleri etiketle anında temizler
export const dynamicParams = true;

// Kombinasyonlar ilk istekte uretilir ve ISR ile onbellege alinir.
export function generateStaticParams() {
  return [];
}

type Params = { locale: string; city: string; specialty: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return generateMetadataImpl({ params, searchParams: {} });
}

export default async function Page({ params }: { params: Params }) {
  return CitySpecialtyPage({ params, searchParams: {} });
}
