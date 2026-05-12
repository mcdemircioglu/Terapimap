import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatExperience(years: number, locale: 'tr' | 'en'): string {
  if (locale === 'tr') return `${years} yıl deneyim`;
  return `${years} ${years === 1 ? 'year' : 'years'} of experience`;
}

/**
 * Returns a deterministic pravatar.cc URL for a professional based on their slug.
 * Images 1–70 are available. The assignment is stable — same slug → same photo.
 */
export function getPlaceholderAvatar(slug: string): string {
  const sum = slug.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const index = (sum % 70) + 1;
  return `https://i.pravatar.cc/150?img=${index}`;
}
