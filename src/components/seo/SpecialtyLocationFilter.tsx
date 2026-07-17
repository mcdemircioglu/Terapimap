'use client';

/**
 * Uzmanlık landing sayfaları için şehir + ilçe seçici.
 * Seçime göre mevcut route'lara yönlendirir (yeni route üretmez):
 *  - şehir           → /{locale}/therapists/{city}/{specialty}
 *  - şehir + ilçe    → /{locale}/therapists/{city}?specialty={specialty}&district={district}
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Select } from '@/components/ui/Select';
import { CITIES } from '@/lib/cities';
import { getDistricts } from '@/lib/districts';
import { slugifyTr } from '@/lib/utils';

type Props = {
  locale: string;
  specialtySlug: string;
};

export default function SpecialtyLocationFilter({ locale, specialtySlug }: Props) {
  const router = useRouter();
  const [city, setCity] = useState('');
  const districts = city ? getDistricts(city) : [];

  // TR'de /therapists kalıcı olarak /terapistler'e yönlenir — redirect'i atla
  const listBase = locale === 'tr' ? 'terapistler' : 'therapists';

  const go = (citySlug: string, districtName: string) => {
    if (!citySlug) return;
    if (districtName) {
      const qs = new URLSearchParams({
        specialty: specialtySlug,
        district: slugifyTr(districtName),
      });
      router.push(`/${locale}/${listBase}/${citySlug}?${qs.toString()}`);
    } else {
      router.push(`/${locale}/${listBase}/${citySlug}/${specialtySlug}`);
    }
  };

  const cityLabel = locale === 'tr' ? 'Şehir' : 'City';
  const districtLabel = locale === 'tr' ? 'İlçe' : 'District';
  const allCities = locale === 'tr' ? 'Şehir seçin' : 'Select a city';
  const allDistricts = locale === 'tr' ? 'Tüm ilçeler' : 'All districts';

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="w-full sm:w-56">
        <label className="mb-1.5 block text-xs font-medium text-brand-700">{cityLabel}</label>
        <Select
          value={city}
          onChange={(e) => {
            const value = e.target.value;
            setCity(value);
            go(value, '');
          }}
          aria-label={cityLabel}
        >
          <option value="">{allCities}</option>
          {CITIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="w-full sm:w-56">
        <label className="mb-1.5 block text-xs font-medium text-brand-700">{districtLabel}</label>
        <Select
          value=""
          onChange={(e) => go(city, e.target.value)}
          disabled={!city}
          aria-label={districtLabel}
          className="disabled:cursor-not-allowed disabled:bg-brand-50 disabled:text-brand-400"
        >
          <option value="">{allDistricts}</option>
          {districts.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
