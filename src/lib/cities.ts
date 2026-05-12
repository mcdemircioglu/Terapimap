// Cities exposed in the UI. Add to this list as we expand coverage.
export const CITIES = [
  { slug: 'istanbul', name: 'Istanbul' },
  { slug: 'ankara',   name: 'Ankara'   },
  { slug: 'izmir',    name: 'Izmir'    },
  { slug: 'bursa',    name: 'Bursa'    },
  { slug: 'antalya',  name: 'Antalya'  },
] as const;

export type CitySlug = (typeof CITIES)[number]['slug'];

/** slug to display name  (e.g. "ankara" to "Ankara") */
export function getCityName(slug: string): string | null {
  return CITIES.find((c) => c.slug === slug)?.name ?? null;
}

/** display name to slug  (e.g. "Ankara" to "ankara") */
export function getCitySlug(name: string): string | null {
  return CITIES.find((c) => c.name === name)?.slug ?? null;
}

export function isKnownCity(slug: string): slug is CitySlug {
  return CITIES.some((c) => c.slug === slug);
}
