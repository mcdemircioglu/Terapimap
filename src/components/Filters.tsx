'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Select } from './ui/Select';
import { CITIES } from '@/lib/cities';
import type { Specialty } from '@/types/database';

export default function Filters({
  locale,
  specialties,
  selectedCity,
  selectedSpecialty,
}: {
  locale: string;
  specialties: Specialty[];
  selectedCity?: string;
  selectedSpecialty?: string;
}) {
  const t = useTranslations('filters');
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  // Mobile: filters start collapsed; desktop: always open via md:block.
  const [mobileOpen, setMobileOpen] = useState(false);

  const online = params.get('online') === '1';
  const hasActive = !!(selectedCity || selectedSpecialty || online);
  const activeCount = [selectedCity, selectedSpecialty, online ? '1' : ''].filter(Boolean).length;

  // All filter changes normalise to /therapists?city=...&specialty=...&online=1
  function buildUrl(city?: string, specialty?: string, isOnline?: boolean) {
    const base = '/' + locale + '/therapists';
    const qs = new URLSearchParams();
    if (city) qs.set('city', city);
    if (specialty) qs.set('specialty', specialty);
    if (isOnline) qs.set('online', '1');
    const search = qs.toString();
    return search ? base + '?' + search : base;
  }

  function navTo(city?: string, specialty?: string) {
    startTransition(() => router.push(buildUrl(city, specialty, online)));
  }

  function setOnline(next: boolean) {
    startTransition(() => router.push(buildUrl(selectedCity, selectedSpecialty, next)));
  }

  return (
    <aside className="rounded-2xl border border-brand-100 bg-white shadow-soft">
      {/* Mobile toggle header */}
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        aria-expanded={mobileOpen}
        aria-controls="filter-body"
        className="flex w-full items-center justify-between p-4 text-left md:hidden"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-brand-900">
          {t('title')}
          {hasActive && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
          className={'h-4 w-4 text-brand-400 transition-transform duration-200' + (mobileOpen ? ' rotate-180' : '')}
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Desktop static header */}
      <div className="hidden p-5 pb-0 md:block">
        <h3 className="text-sm font-semibold text-brand-900">{t('title')}</h3>
      </div>

      {/* Filter controls */}
      <div
        id="filter-body"
        className={'px-4 pb-4 md:mt-4 md:block md:px-5 md:pb-5' + (mobileOpen ? ' block' : ' hidden')}
      >
        <div className="space-y-4">
          {/* City */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-700">
              {t('city')}
            </label>
            <Select
              value={selectedCity ?? ''}
              onChange={(e) => navTo(e.target.value || undefined, selectedSpecialty)}
            >
              <option value="">{t('all')}</option>
              {CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </Select>
          </div>

          {/* Specialty */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-700">
              {t('specialty')}
            </label>
            <Select
              value={selectedSpecialty ?? ''}
              onChange={(e) => navTo(selectedCity, e.target.value || undefined)}
            >
              <option value="">{t('all')}</option>
              {specialties.map((s) => (
                <option key={s.slug} value={s.slug}>{s.name}</option>
              ))}
            </Select>
          </div>

          {/* Online only */}
          <label className="flex items-center gap-2 text-sm text-brand-800">
            <input
              type="checkbox"
              checked={online}
              onChange={(e) => setOnline(e.target.checked)}
              className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-400"
            />
            {t('online')}
          </label>

          {/* Clear */}
          {hasActive && (
            <button
              onClick={() => startTransition(() => router.push('/' + locale + '/therapists'))}
              className="text-xs font-medium text-brand-600 hover:text-brand-800"
            >
              {t('clear')}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
