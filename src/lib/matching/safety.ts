/**
 * Kriz ifadesi kontrolü. Danışan metni kendine zarar / intihar düşüncesi
 * içeriyorsa eşleştirme yapılmaz; acil yardım bilgisi gösterilir. Bu kontrol
 * model çağrısından ÖNCE ve modelden bağımsız çalışır, çünkü güvenlik
 * kararı bir LLM'in takdirine bırakılmamalıdır.
 *
 * Bilinçli olarak geniş tutuldu: yanlış pozitif (gereksiz yardım mesajı)
 * kabul edilebilir, yanlış negatif (krizdeki kişiye terapist listesi
 * göstermek) kabul edilemez.
 */

/** Türkçe karakterleri ve büyük/küçük farkını normalize eder. */
function normalize(text: string): string {
  return text
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

// Normalize edilmiş metinde aranan kalıplar.
const CRISIS_PATTERNS: RegExp[] = [
  /intihar/,
  /kendim?i (oldur|bitir|asmak|asacagim)/,
  /kendime zarar/,
  /kendimi (kesiyor|kesmek|yaral)/,
  /yasamak istemiyor/,
  /yasamayi birakmak/,
  /olmek istiyor/,
  /olsem (daha )?iyi/,
  /hayatima son/,
  /canima kiy/,
  /bu hayata son/,
];

export function detectCrisis(text: string): boolean {
  const t = normalize(text);
  return CRISIS_PATTERNS.some((p) => p.test(t));
}
