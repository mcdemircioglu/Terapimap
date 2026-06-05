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
