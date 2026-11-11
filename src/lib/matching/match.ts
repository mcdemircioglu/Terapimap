import { getTherapists } from '@/lib/queries';
import type { MatchIntent } from './intent';
import { rankTherapists, type RankedTherapist } from './rank';

/**
 * Niyete uyan terapistleri döndürür. Aday havuzu filtresiz getTherapists()
 * çağrısıdır: bu fonksiyon 24 saatlik unstable_cache'li olduğu için her
 * eşleştirme isteği veritabanına gitmez. Eleme ve sıralama rankTherapists()
 * içinde bellekte yapılır.
 */
export async function findMatches(
  intent: MatchIntent,
  limit?: number,
): Promise<RankedTherapist[]> {
  const pool = await getTherapists();
  return rankTherapists(pool, intent, limit);
}
