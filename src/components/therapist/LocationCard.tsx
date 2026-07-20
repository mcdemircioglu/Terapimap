/**
 * 📍 Konum kartı — server component.
 *
 * Görünürlük kuralları:
 *  - is_in_person false ise kart hiç render edilmez (yalnızca online görüşen
 *    uzmanlar için fiziksel konum göstermek yanıltıcı olur).
 *  - Gösterilecek anlamlı veri yoksa (adres / klinik / harita linki / ilçe)
 *    yine render edilmez — boş premium kart bırakmayız.
 *
 * SEO: adres bilgisi iframe'den bağımsız, düz HTML metin olarak render edilir
 * (<address> elementi), böylece arama motorları konumu her durumda okur.
 */
import { getTranslations } from 'next-intl/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Building2Icon,
  ExternalLinkIcon,
  MapIcon,
  MapPinIcon,
  VideoIcon,
} from '@/components/ui/icons';
import LocationMap from '@/components/therapist/LocationMap';
import {
  buildEmbedUrl,
  buildOutboundMapsUrl,
  getResolvedMapsData,
  hasDisplayableLocation,
  type MapLocation,
  type ResolvedMapsData,
} from '@/lib/maps';
import type { ProfessionalWithSpecialties } from '@/types/database';

type Props = {
  therapist: ProfessionalWithSpecialties;
  locale: string;
  /** Sayfa zaten çözümlediyse tekrar fetch edilmez. */
  resolvedMaps?: ResolvedMapsData | null;
};

export default async function LocationCard({ therapist, locale, resolvedMaps: pre }: Props) {
  if (!therapist.is_in_person) return null;

  // Kısa link / place_id linkleri koordinat içermez → sunucuda çözümlenir
  // (30 gün cache'li), böylece embed her zaman pin gösterebilir.
  const resolved =
    pre !== undefined
      ? pre
      : therapist.google_maps_url
      ? await getResolvedMapsData(therapist.google_maps_url)
      : null;

  const location: MapLocation = {
    city: therapist.city,
    district: therapist.district,
    address: therapist.address,
    clinicName: therapist.clinic_name,
    googleMapsUrl: resolved?.url ?? therapist.google_maps_url,
    // İleride DB'ye lat/lng eklendiğinde burası DB'den beslenir
    coordinates: resolved?.coordinates ?? null,
  };

  if (!hasDisplayableLocation(location)) return null;

  const t = await getTranslations({ locale, namespace: 'detail' });
  const embedUrl = buildEmbedUrl(location, locale);
  // Mobil Maps uygulamalarında da çalışan, place_id'yi doğru çözen link
  const outboundUrl = buildOutboundMapsUrl(location);
  const areaLine = [therapist.district, therapist.city].filter(Boolean).join(', ');

  return (
    <Card className="p-6 md:p-8">
      {/* Başlık + görüşme rozetleri */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h2 className="flex items-center gap-2.5 text-lg font-semibold text-brand-900">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <MapPinIcon className="h-[18px] w-[18px]" />
          </span>
          {t('location')}
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {therapist.is_in_person && (
            <Badge variant="brand" className="gap-1.5 px-3 py-1">
              <MapPinIcon className="h-3.5 w-3.5" />
              {t('inPersonBadge')}
            </Badge>
          )}
          {therapist.is_online && (
            <Badge variant="accent" className="gap-1.5 px-3 py-1">
              <VideoIcon className="h-3.5 w-3.5" />
              {t('onlineBadge')}
            </Badge>
          )}
        </div>
      </div>

      {/* Harita — lazy embed; embed mümkün değilse zarif fallback */}
      <div className="mt-5">
        {embedUrl ? (
          <LocationMap
            embedUrl={embedUrl}
            title={t('mapTitle', { name: therapist.name })}
            showMapLabel={t('showMap')}
          />
        ) : outboundUrl ? (
          <a
            href={outboundUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-40 w-full flex-col items-center justify-center gap-3 rounded-xl border border-brand-100 bg-brand-50/60 transition-colors hover:bg-brand-50"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-600 shadow-soft ring-1 ring-brand-100">
              <MapIcon className="h-6 w-6" />
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 group-hover:text-brand-900 group-hover:underline">
              {t('viewOnMaps')}
              <ExternalLinkIcon className="h-3.5 w-3.5" />
            </span>
          </a>
        ) : null}
      </div>

      {/* Konum bilgileri — SEO için düz HTML metin */}
      <div className="mt-6 space-y-1.5">
        {therapist.clinic_name && (
          <p className="flex items-center gap-2 text-base font-semibold text-brand-900">
            <Building2Icon className="h-[18px] w-[18px] flex-shrink-0 text-brand-500" />
            {therapist.clinic_name}
          </p>
        )}
        <address className="not-italic">
          {therapist.address && (
            <p className="leading-relaxed text-brand-800">{therapist.address}</p>
          )}
          {areaLine && <p className="text-sm text-brand-600">{areaLine}</p>}
        </address>
      </div>
    </Card>
  );
}
