// Cities exposed in the UI. Add to this list as we expand coverage.
export const CITIES = [
  { slug: 'istanbul',  name: 'İstanbul'  },
  { slug: 'ankara',    name: 'Ankara'    },
  { slug: 'izmir',     name: 'İzmir'     },
  { slug: 'bursa',     name: 'Bursa'     },
  { slug: 'antalya',   name: 'Antalya'   },
  { slug: 'adana',     name: 'Adana'     },
  { slug: 'konya',     name: 'Konya'     },
  { slug: 'gaziantep', name: 'Gaziantep' },
  { slug: 'kocaeli',   name: 'Kocaeli'   },
  { slug: 'mersin',    name: 'Mersin'    },
  { slug: 'eskisehir', name: 'Eskişehir' },
  { slug: 'samsun',    name: 'Samsun'    },
  { slug: 'trabzon',   name: 'Trabzon'   },
  { slug: 'kayseri',   name: 'Kayseri'   },
  { slug: 'denizli',   name: 'Denizli'   },
] as const;

export type CitySlug = (typeof CITIES)[number]['slug'];

/** Türkçe karakterleri ASCII'ye normalize eder — case-insensitive karşılaştırma için */
function normalizeTr(s: string): string {
  return s
    .replace(/İ/g, 'i').replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
    .replace(/Ü/g, 'u').replace(/ü/g, 'u')
    .replace(/Ş/g, 's').replace(/ş/g, 's')
    .replace(/Ö/g, 'o').replace(/ö/g, 'o')
    .replace(/Ç/g, 'c').replace(/ç/g, 'c')
    .toLowerCase();
}

/** slug → display name  (e.g. "ankara" → "Ankara") */
export function getCityName(slug: string): string | null {
  return CITIES.find((c) => c.slug === slug)?.name ?? null;
}

/** display name → slug  — Türkçe karakter ve büyük/küçük harf duyarsız */
export function getCitySlug(name: string): string | null {
  const n = normalizeTr(name);
  return CITIES.find((c) => normalizeTr(c.name) === n)?.slug ?? null;
}

export function isKnownCity(slug: string): slug is CitySlug {
  return CITIES.some((c) => c.slug === slug);
}
