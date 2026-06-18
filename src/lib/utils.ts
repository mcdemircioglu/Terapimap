import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Professional type → URL segment mapping
const PROF_TYPE_URL: Record<string, string> = {
  psychologist:          'psikolog',
  clinical_psychologist: 'psikolog',
  psychiatrist:          'psikiyatrist',
  family_therapist:      'aile-terapisti',
  counselor:             'danisan',
};

export function getProfessionalUrlSegment(professionalType: string | null | undefined): string {
  return PROF_TYPE_URL[professionalType ?? ''] ?? 'psikolog';
}

export function getProfessionalUrl(
  slug: string,
  professionalType: string | null | undefined,
  locale: string,
): string {
  return '/' + locale + '/' + getProfessionalUrlSegment(professionalType) + '/' + slug;
}

export function formatExperience(years: number, locale: 'tr' | 'en'): string {
  if (locale === 'tr') return `${years} yıl deneyim`;
  return `${years} ${years === 1 ? 'year' : 'years'} of experience`;
}

const TR_MAP: Record<string, string> = {
  ğ: 'g', ü: 'u', ş: 's', ı: 'i', ö: 'o', ç: 'c',
  Ğ: 'g', Ü: 'u', Ş: 's', İ: 'i', Ö: 'o', Ç: 'c',
};

/** "Ataşehir" → "atasehir", "Büyükçekmece" → "buyukcekm..." */
export function slugifyTr(text: string): string {
  return text
    .split('')
    .map((c) => TR_MAP[c] ?? c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Bir slug'a karşılık gelen display name'i listeden bul. */
export function findBySlug<T extends string>(list: T[], slug: string): T | undefined {
  return list.find((item) => slugifyTr(item) === slug);
}
