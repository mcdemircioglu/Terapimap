/**
 * Ana sayfadaki kutudan eşleştirme sayfasına metin taşıma anahtarı.
 *
 * Danışanın yazdığı metin sağlık verisi sayılabileceği için URL'ye (query
 * string) KONMAZ; tarayıcı geçmişine, sunucu loglarına ve analitik araçlarına
 * sızmasın diye yalnızca sessionStorage ile taşınır. Eşleştirme sayfası
 * okuduğu anda anahtarı siler, sekme kapanınca zaten silinir.
 */
export const MATCH_HANDOFF_KEY = 'terapimap:match-text';
