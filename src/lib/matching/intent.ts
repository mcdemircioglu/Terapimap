import { CITIES } from '@/lib/cities';
import type { ProfessionalType } from '@/types/database';

/**
 * AI eşleştirmede danışanın serbest metninden çıkarılan yapılandırılmış niyet.
 * Model çıktısına doğrudan güvenilmez: sanitizeIntent() her alanı bilinen
 * değerlere (uzmanlık slug'ları, şehirler, terapist türleri) karşı doğrular,
 * böylece model uydurma bir değer üretse bile sorguya sızmaz.
 */
export type MatchIntent = {
  /** specialties tablosundaki slug'lar, en alakalıdan başlayarak. */
  specialtySlugs: string[];
  citySlug: string | null;
  /** true: yalnızca online istiyor, false: yalnızca yüz yüze, null: fark etmez. */
  wantsOnline: boolean | null;
  professionalType: ProfessionalType | null;
};

export const EMPTY_INTENT: MatchIntent = {
  specialtySlugs: [],
  citySlug: null,
  wantsOnline: null,
  professionalType: null,
};

/** Bir danışan talebinde anlamlı olabilecek en fazla uzmanlık sayısı. */
const MAX_SPECIALTIES = 4;

const PROFESSIONAL_TYPES: readonly ProfessionalType[] = [
  'psychologist',
  'clinical_psychologist',
  'psychiatrist',
  'child_psychiatrist',
  'family_therapist',
  'counselor',
];

const CITY_SLUGS: ReadonlySet<string> = new Set(CITIES.map((c) => c.slug));

/**
 * Modelin döndürdüğü ham nesneyi güvenli MatchIntent'e çevirir.
 * Beklenmeyen şekil ya da bilinmeyen değer sessizce boş bırakılır; eşleştirme
 * o kriter olmadan devam eder.
 */
export function sanitizeIntent(
  raw: unknown,
  validSpecialtySlugs: ReadonlySet<string>,
): MatchIntent {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_INTENT };
  const r = raw as Record<string, unknown>;

  const specialtySlugs = Array.isArray(r.specialtySlugs)
    ? Array.from(
        new Set(
          r.specialtySlugs.filter(
            (s): s is string => typeof s === 'string' && validSpecialtySlugs.has(s),
          ),
        ),
      ).slice(0, MAX_SPECIALTIES)
    : [];

  const citySlug =
    typeof r.citySlug === 'string' && CITY_SLUGS.has(r.citySlug) ? r.citySlug : null;

  const wantsOnline = typeof r.wantsOnline === 'boolean' ? r.wantsOnline : null;

  const professionalType =
    typeof r.professionalType === 'string' &&
    (PROFESSIONAL_TYPES as readonly string[]).includes(r.professionalType)
      ? (r.professionalType as ProfessionalType)
      : null;

  return { specialtySlugs, citySlug, wantsOnline, professionalType };
}
