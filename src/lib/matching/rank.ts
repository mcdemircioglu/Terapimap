import type { ProfessionalWithSpecialties, Specialty } from '@/types/database';
import { getCityName } from '@/lib/cities';
import type { MatchIntent } from './intent';

export type RankedTherapist = {
  therapist: ProfessionalWithSpecialties;
  score: number;
  /** Danışan talebiyle örtüşen uzmanlıklar (gerekçe cümlesinin hammaddesi). */
  matchedSpecialties: Specialty[];
  /** Konum açısından neden uygun: yüz yüze aynı şehir ya da online. */
  locationFit: 'same_city' | 'online' | 'none';
};

const DEFAULT_LIMIT = 5;

/**
 * Aday havuzunu danışan niyetine göre puanlayıp sıralar. Saf fonksiyondur:
 * veritabanına ya da modele dokunmaz, bu yüzden aynı girdi her zaman aynı
 * sonucu verir ve elle denenebilir. Sıralamayı bilinçli olarak LLM'e
 * bırakmıyoruz; model yalnızca niyeti çıkarır.
 *
 * Sert elemeler (aday listeden çıkar):
 *  - Doğrulanmamış (is_verified !== true) profil.
 *  - Niyette uzmanlık varsa, hiçbiriyle örtüşmeyen terapist.
 *  - Terapist türü istenmişse, türü farklı olan terapist.
 *  - Konum istenmişse (şehir ve/veya online/yüz yüze), hiçbir şekilde
 *    karşılamayan terapist.
 */
export function rankTherapists(
  pool: ProfessionalWithSpecialties[],
  intent: MatchIntent,
  limit: number = DEFAULT_LIMIT,
): RankedTherapist[] {
  const cityName = intent.citySlug ? getCityName(intent.citySlug) : null;
  const ranked: RankedTherapist[] = [];

  for (const t of pool) {
    // Yalnızca doğrulanmış (rozetli) profiller önerilir: danışana doğrulanmamış
    // bir kişiyi "sana uygun" diye sunmak güven sorunu yaratır.
    if (t.is_verified !== true) continue;

    if (intent.professionalType && t.professional_type !== intent.professionalType) {
      continue;
    }

    // Uzmanlık: sırası önemli, ilk slug danışanın ana derdi. Öndeki eşleşme
    // daha çok puan getirir (4, 3, 2, 1).
    let specialtyScore = 0;
    const matchedSpecialties: Specialty[] = [];
    intent.specialtySlugs.forEach((slug, i) => {
      const found = t.specialties.find((s) => s.slug === slug);
      if (found) {
        specialtyScore += Math.max(1, 4 - i);
        matchedSpecialties.push(found);
      }
    });
    if (intent.specialtySlugs.length > 0 && matchedSpecialties.length === 0) continue;

    // Konum: online talebi, aynı şehirde yüz yüze ve farklı şehirden online
    // ayrı değerlendirilir.
    const sameCity = !!cityName && t.city === cityName;
    const canOnline = t.is_online === true;
    const canInPerson = t.is_in_person === true;

    let locationFit: RankedTherapist['locationFit'] = 'none';
    let locationScore = 0;

    if (intent.wantsOnline === true) {
      if (!canOnline) continue;
      locationFit = 'online';
      locationScore = sameCity ? 3 : 2;
    } else if (intent.wantsOnline === false) {
      // Yalnızca yüz yüze: şehir verilmediyse yüz yüze çalışan herkes uygun.
      if (!canInPerson) continue;
      if (cityName && !sameCity) continue;
      locationFit = sameCity ? 'same_city' : 'none';
      locationScore = sameCity ? 3 : 1;
    } else if (cityName) {
      if (sameCity && canInPerson) {
        locationFit = 'same_city';
        locationScore = 3;
      } else if (canOnline) {
        locationFit = 'online';
        locationScore = sameCity ? 2 : 1;
      } else {
        continue;
      }
    }

    // Güven sinyalleri: doğrulama ve öne çıkarma ağırlığı, uzmanlık ve
    // konum uyumunu geçemeyecek kadar küçük tutuldu.
    const trustScore =
      (t.is_verified ? 1 : 0) +
      (t.is_featured ? 0.5 : 0) +
      (t.rating ?? 0) * 0.2 +
      Math.min(t.experience_years ?? 0, 20) * 0.02;

    ranked.push({
      therapist: t,
      score: specialtyScore * 2 + locationScore + trustScore,
      matchedSpecialties,
      locationFit,
    });
  }

  ranked.sort(
    (a, b) =>
      b.score - a.score ||
      (a.therapist.name ?? '').localeCompare(b.therapist.name ?? '', 'tr'),
  );
  return ranked.slice(0, limit);
}
