/**
 * Google Maps helpers — embed URL'leri, yol tarifi linkleri ve koordinat çıkarımı.
 *
 * Tasarım notu (geleceğe hazırlık):
 * Tüm fonksiyonlar `MapLocation` üzerinden çalışır. İleride veritabanına
 * lat/lng kolonları eklendiğinde tek yapılması gereken `coordinates` alanını
 * doldurmaktır — geri kalan her şey (embed, yol tarifi, JSON-LD geo)
 * otomatik olarak koordinatları önceliklendirir.
 */

import { unstable_cache } from 'next/cache';

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

/**
 * Google Maps place URL'inden işletme/yer adını çıkarır.
 * Örn: /maps/place/Uzman+Psikolog+Burak+AKKAYA/@39.90,32.81,17z → "Uzman Psikolog Burak AKKAYA"
 */
export function extractPlaceNameFromUrl(url: string): string | null {
  const match = url.match(/\/maps\/place\/([^/@?]+)/);
  if (!match) return null;
  try {
    const name = decodeURIComponent(match[1].replace(/\+/g, ' ')).trim();
    // Koordinat biçimindeki "place" segmentlerini adres sanma
    if (!name || new RegExp(`^${LAT_LNG}$`).test(name)) return null;
    return name;
  } catch {
    return null;
  }
}

/** Kısaltılmış Google Maps linki mi? (koordinat/yer adı içermez, çözümlenmesi gerekir) */
export function isShortMapsUrl(url: string): boolean {
  return /^https?:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs)\//i.test(url);
}

/**
 * Kısa linki sunucu tarafında redirect zincirini izleyerek tam URL'e çözer.
 * Sonuç Next.js data cache'inde 30 gün saklanır → istek başına maliyet yok.
 * Çözümlenemezse orijinal URL döner (asla throw etmez).
 */
export async function resolveGoogleMapsUrl(url: string): Promise<string> {
  if (!isShortMapsUrl(url)) return url;

  let current = url;
  try {
    for (let hop = 0; hop < 4; hop++) {
      const res = await fetch(current, {
        redirect: 'manual',
        signal: AbortSignal.timeout(4000),
        next: { revalidate: 60 * 60 * 24 * 30 },
      });
      const next = res.headers.get('location');
      if (!next) break;
      current = new URL(next, current).toString();
      // Koordinat veya yer adı yakalandıysa daha fazla hop'a gerek yok
      if (extractCoordinatesFromUrl(current) || extractPlaceNameFromUrl(current)) break;
    }
  } catch {
    return url;
  }
  return current;
}

/** Google Maps URL'inden place_id çıkarır (q=place_id:X, query_place_id=X). */
export function extractPlaceIdFromUrl(url: string): string | null {
  const match = url.match(/(?:place_id[:=]|query_place_id=)([A-Za-z0-9_-]{16,})/);
  return match ? match[1] : null;
}

/**
 * Google Maps sayfa HTML'inden koordinat kazır. Sunucu tarafında render
 * edilen HTML'de koordinatlar birkaç yerde bulunur; en güvenilirden
 * en genele doğru denenir.
 */
export function extractCoordinatesFromHtml(html: string): MapCoordinates | null {
  const toCoords = (latS: string, lngS: string): MapCoordinates | null => {
    const lat = Number.parseFloat(latS);
    const lng = Number.parseFloat(lngS);
    return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
      ? { lat, lng }
      : null;
  };

  // 1) <meta itemprop="image" content="...staticmap?center=lat%2Clng...">
  let m = html.match(new RegExp(String.raw`center=(-?\d{1,2}\.\d+)%2C(-?\d{1,3}\.\d+)`));
  if (m) return toCoords(m[1], m[2]);

  // 2) canonical / og:url linkindeki @lat,lng
  m = html.match(/<(?:link[^>]+rel="canonical"|meta[^>]+og:url)[^>]+content="([^"]+)"[^>]*>/) ??
      html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/);
  if (m) {
    const fromCanonical = extractCoordinatesFromUrl(m[1]);
    if (fromCanonical) return fromCanonical;
  }

  // 3) APP_INITIALIZATION_STATE=[[[zoom,lng,lat]  (lng/lat ters sırada)
  m = html.match(new RegExp(String.raw`APP_INITIALIZATION_STATE=\[\[\[-?\d+(?:\.\d+)?,(-?\d{1,3}\.\d+),(-?\d{1,2}\.\d+)\]`));
  if (m) return toCoords(m[2], m[1]);

  // 4) Genel: HTML içinde herhangi bir @lat,lng / !3d!4d kalıbı
  return extractCoordinatesFromUrl(html);
}

/**
 * Koordinat içermeyen Google Maps URL'leri (place_id linkleri gibi) için
 * sayfayı sunucuda çekip HTML'den koordinat kazır. Büyük HTML gövdesi
 * data cache'e YAZILMAZ (cache: no-store) — sonuç, çağıran katmandaki
 * unstable_cache ile saklanır.
 */
export async function fetchCoordinatesFromPage(url: string): Promise<MapCoordinates | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
        // AB consent yönlendirmesini atlamak için
        Cookie: 'CONSENT=YES+cb.20210720-07-p0.en+FX+410',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(6000),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const html = await res.text();
    return extractCoordinatesFromHtml(html);
  } catch {
    return null;
  }
}

/** Çözümlenmiş harita verisi — embed, yol tarifi ve JSON-LD geo bundan beslenir. */
export type ResolvedMapsData = {
  url: string;
  coordinates: MapCoordinates | null;
};

/**
 * Tek giriş noktası: kayıtlı google_maps_url ne biçimde olursa olsun
 * (kısa link, place_id linki, tam URL) embed'e hazır veri üretir.
 *  1. Kısa link ise redirect zinciri çözülür.
 *  2. URL koordinat içeriyorsa doğrudan kullanılır.
 *  3. Yer adı varsa embed sorgusu için yeterlidir (fetch gerekmez).
 *  4. place_id gibi opak linklerde sayfa HTML'inden koordinat kazılır.
 */
export async function resolveMapsData(url: string): Promise<ResolvedMapsData> {
  const expanded = await resolveGoogleMapsUrl(url);

  const fromUrl = extractCoordinatesFromUrl(expanded);
  if (fromUrl) return { url: expanded, coordinates: fromUrl };

  if (extractPlaceNameFromUrl(expanded)) return { url: expanded, coordinates: null };

  let coordinates: MapCoordinates | null = null;
  if (/google\.[a-z.]{2,10}\/maps/i.test(expanded)) {
    coordinates = await fetchCoordinatesFromPage(expanded);
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log('[maps] resolveMapsData:', url, '→', expanded, coordinates);
  }
  return { url: expanded, coordinates };
}

/**
 * resolveMapsData'nın cache'li hâli — sonuç (URL + koordinat) 30 gün saklanır,
 * büyük HTML gövdesi asla cache'e girmez. Sayfalar bunu kullanmalıdır.
 */
export const getResolvedMapsData = unstable_cache(resolveMapsData, ['maps-resolve'], {
  revalidate: 60 * 60 * 24 * 30,
});

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
 * Öncelik: koordinat → URL'deki yer adı → adres sorgusu.
 * Hiçbiri yoksa null döner → arayüz "Google Haritalar'da Görüntüle" düzenine düşer.
 */
export function buildEmbedUrl(location: MapLocation, hl: string = 'tr'): string | null {
  const coords = resolveCoordinates(location);
  if (coords) {
    return `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=16&hl=${hl}&output=embed`;
  }
  // Koordinat yoksa URL'deki yer adı üzerinden pin göster (şehirle birlikte,
  // yanlış eşleşme riskini azaltmak için)
  const placeName = location.googleMapsUrl ? extractPlaceNameFromUrl(location.googleMapsUrl) : null;
  if (placeName) {
    const placeQuery = [placeName, location.district, location.city].filter(Boolean).join(', ');
    return `https://maps.google.com/maps?q=${encodeURIComponent(placeQuery)}&z=16&hl=${hl}&output=embed`;
  }
  const query = buildAddressQuery(location);
  if (query) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&hl=${hl}&output=embed`;
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
