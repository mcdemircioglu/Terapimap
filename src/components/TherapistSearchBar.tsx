'use client';

/**
 * Terapist isim arama çubuğu — listeleme sayfalarının üstünde.
 * Mevcut URL'i (şehir/uzmanlık path'i + diğer query filtreleri) koruyarak
 * yalnızca `q` parametresini günceller ve sayfalamayı sıfırlar.
 */
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

export default function TherapistSearchBar({
  placeholder = 'Terapist adı ara…',
  clearLabel = 'Temizle',
  submitLabel = 'Ara',
}: {
  placeholder?: string;
  clearLabel?: string;
  submitLabel?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const current = params.get('q') ?? '';
  const [value, setValue] = useState(current);

  // URL dışarıdan değişirse input'u eşitle (ör. "Temizle" veya geri/ileri)
  useEffect(() => {
    setValue(current);
  }, [current]);

  function navigate(next: string) {
    const qs = new URLSearchParams(Array.from(params.entries()));
    const v = next.trim();
    if (v) qs.set('q', v);
    else qs.delete('q');
    qs.delete('page'); // arama değişince ilk sayfaya dön
    const s = qs.toString();
    startTransition(() => router.push(s ? `${pathname}?${s}` : pathname));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate(value);
  }

  return (
    <form onSubmit={onSubmit} className="mb-5 flex gap-2" role="search">
      <div className="relative flex-1">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-brand-400">
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
            <circle cx="9" cy="9" r="6" />
            <path d="M14 14l3 3" strokeLinecap="round" />
          </svg>
        </span>
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="h-11 w-full rounded-lg border border-brand-200 bg-white pl-9 pr-9 text-sm text-brand-900 placeholder:text-brand-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/40"
        />
        {value && (
          <button
            type="button"
            onClick={() => { setValue(''); navigate(''); }}
            aria-label={clearLabel}
            className="absolute inset-y-0 right-2 flex items-center px-1 text-brand-400 hover:text-brand-700"
          >
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.6">
              <path strokeLinecap="round" d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        )}
      </div>
      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-600 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        {submitLabel}
      </button>
    </form>
  );
}
