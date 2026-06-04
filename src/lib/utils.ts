import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatExperience(years: number, locale: 'tr' | 'en'): string {
  if (locale === 'tr') return `${years} yıl deneyim`;
  return `${years} ${years === 1 ? 'year' : 'years'} of experience`;
}
