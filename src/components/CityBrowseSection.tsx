/**
 * Şehre göre gözat — /terapistler dizin sayfasının üstünde.
 * Ana sayfa ve dizin sayfası daha önce hiçbir şehir sayfasına statik link
 * vermiyordu (P1 denetimi, "Internal linking / Orphan pages"); şehir ve
 * şehir×uzmanlık sayfaları yalnızca sitemap.xml üzerinden keşfediliyordu.
 * Bu bileşen üst düzeyden orta katmana gerçek bir link akışı sağlar.
 */
import Link from 'next/link';
import Container from './Container';
import { CITIES } from '@/lib/cities';
import { MIN_THERAPISTS_FOR_INDEX } from '@/lib/seo-landing';
import { MapPinIcon } from '@/components/ui/icons';

export default function CityBrowseSection({
  locale,
  cityCounts,
}: {
  locale: string;
  /** Şehir slug → terapist sayısı. Verilirse yalnızca indekslenebilir (eşiği geçen) şehirler gösterilir. */
  cityCounts?: Record<string, number>;
}) {
  const listBase = locale === 'tr' ? 'terapistler' : 'therapists';
  const cities = cityCounts
    ? CITIES.filter((c) => (cityCounts[c.slug] ?? 0) >= MIN_THERAPISTS_FOR_INDEX)
    : CITIES;
  if (cities.length === 0) return null;

  return (
    <section className="border-b border-brand-100 bg-white">
      <Container className="py-6 md:py-8">
        <h2 className="text-sm font-semibold text-brand-800">Şehre Göre Gözat</h2>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {cities.map((city) => (
            <Link
              key={city.slug}
              href={`/${locale}/${listBase}/${city.slug}`}
              className="group inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-900"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-500 transition-colors group-hover:bg-brand-100 group-hover:text-brand-600">
                <MapPinIcon className="h-4 w-4" />
              </span>
              {city.name}
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
