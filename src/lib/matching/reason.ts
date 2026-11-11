import type { RankedTherapist } from './rank';

/** Tek uzmanlıkta "alanında", birden fazlasında "alanlarında". */
function areaSuffix(count: number): string {
  return count === 1 ? 'alanında' : 'alanlarında';
}

/**
 * Eşleşme gerekçesi, terapistin gerçek profil verisinden şablonla üretilir;
 * model çağrısı yoktur. Böylece gerekçe asla uydurma bir uzmanlık ya da
 * deneyim iddia etmez ve her sonuç için ek maliyet oluşmaz.
 *
 * Aynı talebe uyan beş terapistin kartı birbirinin kopyası görünmesin diye
 * her gerekçe iki parçadır: (1) talebe uyan uzmanlıklar, (2) terapiste özgü
 * bir ayrıntı (deneyim yılı, talep dışındaki diğer uzmanlıkları, konum).
 */
export function buildReason(r: RankedTherapist): string {
  const t = r.therapist;
  const sentences: string[] = [];

  // Uzmanlık adları "ve" içerebildiği için ("Anksiyete ve Stres") listeyi
  // yalnızca virgülle birleştiriyoruz; "A, B ve C" okunurken yanlış bölünür.
  const matched = r.matchedSpecialties.map((s) => s.name).slice(0, 3);
  if (matched.length > 0) {
    sentences.push(`${matched.join(', ')} ${areaSuffix(matched.length)} çalışıyor`);
  }

  // Terapiste özgü ayrıntı: ilk uygun olan seçilir, hepsi art arda yazılmaz.
  const matchedIds = new Set(r.matchedSpecialties.map((s) => s.id));
  const extras = t.specialties.filter((s) => !matchedIds.has(s.id)).slice(0, 2);
  const years = t.experience_years;

  if (years && years >= 3) {
    sentences.push(`${years} yıllık deneyimi var`);
  } else if (extras.length > 0) {
    sentences.push(`ayrıca ${extras.map((s) => s.name).join(', ')} ${areaSuffix(extras.length)} da çalışıyor`);
  }

  // Konum bilgisi: yüz yüze aynı şehir daha ayırt edicidir; online ise
  // zaten çoğu sonuçta ortak olduğu için son sırada ve kısa yazılır.
  if (r.locationFit === 'same_city' && t.city) {
    sentences.push(`${t.city}'da yüz yüze görüşebiliyor`);
  } else if (r.locationFit === 'online') {
    sentences.push('online görüşebiliyor');
  }

  if (sentences.length === 0) return 'Profili talebinle uyumlu görünüyor.';
  const text = sentences.join(', ');
  return text.charAt(0).toLocaleUpperCase('tr') + text.slice(1) + '.';
}
