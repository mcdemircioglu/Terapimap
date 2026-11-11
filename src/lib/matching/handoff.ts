/**
 * Ana sayfadaki kutudan eşleştirme sayfasına metin taşıma anahtarı.
 *
 * Danışanın yazdığı metin sağlık verisi sayılabileceği için URL'ye (query
 * string) KONMAZ; tarayıcı geçmişine, sunucu loglarına ve analitik araçlarına
 * sızmasın diye yalnızca sessionStorage ile taşınır. Eşleştirme sayfası
 * okuduğu anda anahtarı siler, sekme kapanınca zaten silinir.
 */
export const MATCH_HANDOFF_KEY = 'terapimap:match-text';

/**
 * Son eşleştirme sonuçları (kartlar). Kullanıcı bir profile bakıp geri
 * dönünce diğer önerileri de inceleyebilsin diye aynı sekmede tutulur.
 * Danışanın yazdığı METİN burada saklanmaz, yalnızca terapist kartları.
 * sessionStorage olduğu için sekme kapanınca silinir.
 */
export const MATCH_RESULT_KEY = 'terapimap:match-result';
