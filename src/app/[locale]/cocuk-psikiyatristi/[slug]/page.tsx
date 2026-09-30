import type { Metadata } from 'next';
import { generateMetadataImpl, ProfileDetail } from '@/lib/page-views/profile';

// /[locale]/cocuk-psikiyatristi/[slug] — cocuk psikiyatristleri icin canonical URL
export const revalidate = 3600;
export const dynamicParams = true;

// Profiller ilk istekte uretilir ve ISR ile onbellege alinir (ƒ yerine ● olur).
export function generateStaticParams() {
  return [];
}

type Params = { locale: string; slug: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return generateMetadataImpl({ params });
}

export default async function Page({ params }: { params: Params }) {
  return ProfileDetail({ params, segment: 'cocuk-psikiyatristi' });
}
