/**
 * Google Maps helpers — embed URL'leri, yol tarifi linkleri ve koordinat çıkarımı.
 *
 * Tasarım notu (geleceğe hazırlık):
 * Tüm fonksiyonlar `MapLocation` üzerinden çalışır. İleride veritabanına
 * lat/lng kolonları eklendiğinde tek yapılması gereken `coordinates` alanını
 * doldurmaktır — geri kalan her şey (embed, yol tarifi, JSON-LD geo)
 * otomatik olarak koordinatları önceliklendirir.
 */

export type MapCoordinates = {
  lat: number;
  lng: number;
};

export type MapLocation = {
  city: string;
  district?: string | null;
  address?: string | null;
  clinicName?: string | null;
  googleMapsUrl?: string | null;
  /** İleride DB'den gelecek — dolduğunda googleMapsUrl'e göre öncelik kazanır. */
  coordinates?: MapCoordinates | null;
};

const LAT_LNG = String.raw`(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)`;

/**
 * Bir Google Maps URL'inden koordinat çıkarmayı dener.
 * Desteklenen biçimler: `!3d..!4d..`, `@lat,lng`, `?q|query|ll|destination=lat,lng`.
 * Kısaltılmış linklerde (maps.app.goo.gl) koordinat bulunamaz → null.
 */
export function extractCoordinatesFromUrl(url: string): MapCoordinates | null {
  const patterns = [
    new RegExp(String.raw`!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)`),
    new RegExp(String.raw`@${LAT_LNG}`),
    new RegExp(String.raw`[?&](?:q|query|ll|destination)=${LAT_LNG}`),
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (!match) continue;
    const lat = Number.parseFloat(match[1]);
    const lng = Number.parseFloat(match[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }
  return null;
}

/** Koordinat önceliği: DB koordinatı → URL'den çıkarılan koordinat. */
export function resolveCoordinates(location: MapLocation): MapCoordinates | null {
  if (location.coordinates) return location.coordinates;
  if (location.googleMapsUrl) return extractCoordinatesFromUrl(location.googleMapsUrl);
  return null;
}

function isNonEmpty(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * Adres tabanlı arama sorgusu. Yanlış pin göstermemek için en az
 * açık adres veya klinik adı gerektirir; sadece şehir/ilçe yeterli değildir.
 */
function buildAddressQuery(location: MapLocation): string | null {
  if (!isNonEmpty(location.address) && !isNonEmpty(location.clinicName)) return null;
  return [location.clinicName, location.address, location.district, location.city]
    .filter(isNonEmpty)
    .map((part) => part.trim())
    .join(', ');
}

/**
 * API anahtarı gerektirmeyen Google Maps embed URL'i.
 * Koordinat varsa pin doğrudan koordinata, yoksa adres sorgusuna oturur.
 * Hiçbiri yoksa null döner → arayüz "Google Haritalar'da Görüntüle" düzenine düşer.
 */
export function buildEmbedUrl(location: MapLocation, hl: string = 'tr'): string | null {
  const coords = resolveCoordinates(location);
  if (coords) {
    return `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&hl=${hl}&output=embed`;
  }
  const query = buildAddressQuery(location);
  if (query) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&hl=${hl}&output=embed`;
  }
  return null;
}

/**
 * Yol tarifi CTA linki. Öncelik: kayıtlı google_maps_url (işletme profiline
 * gider) → koordinat → adres sorgusu ile Directions API deep-link.
 */
export function buildDirectionsUrl(location: MapLocation): string | null {
  if (isNonEmpty(location.googleMapsUrl)) return location.googleMapsUrl;

  const coords = resolveCoordinates(location);
  if (coords) {
    return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
  }
  const query = buildAddressQuery(location);
  if (query) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
  }
  return null;
}

/** Konum kartını göstermeye değecek kadar veri var mı? */
export function hasDisplayableLocation(location: MapLocation): boolean {
  return (
    isNonEmpty(location.googleMapsUrl) ||
    isNonEmpty(location.address) ||
    isNonEmpty(location.clinicName) ||
    isNonEmpty(location.district)
  );
}
