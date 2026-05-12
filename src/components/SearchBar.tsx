'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { CITIES } from '@/lib/cities';
import type { Specialty } from '@/types/database';

export default function SearchBar({
  locale,
  specialties,
}: {
  locale: string;
  specialties: Specialty[];
}) {
  const t = useTranslations('home');
  const router = useRouter();
  const [city, setCity] = useState('');
  const [specialty, setSpecialty] = useState('');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qs = new URLSearchParams();
    if (city) qs.set('city', city);
    if (specialty) qs.set('specialty', specialty);
    const search = qs.toString();
    router.push(search ? '/' + locale + '/therapists?' + search : '/' + locale + '/therapists');
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-3 rounded-2xl bg-white p-3 shadow-soft ring-1 ring-brand-100 sm:grid-cols-[1fr_1fr_auto]"
    >
      <div>
        <label className="sr-only">{t('searchCity')}</label>
        <Select value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">{t('searchAllCities')}</option>
          {CITIES.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </Select>
      </div>
      <div>
        <label className="sr-only">{t('searchSpecialty')}</label>
        <Select value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
          <option value="">{t('searchAllSpecialties')}</option>
          {specialties.map((s) => (
            <option key={s.slug} value={s.slug}>{s.name}</option>
          ))}
        </Select>
      </div>
      <Button type="submit" size="lg" className="w-full sm:w-auto">
        {t('searchButton')}
      </Button>
    </form>
  );
}
