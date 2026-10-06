/**
 * Terapist Duyuruları (Etkinlik / Eğitim / İş İlanı) — public sorgu
 * katmanı + validasyon. articles.ts ile aynı rol ayrımı: public okuma
 * (anon client + RLS) burada, yazma panel/admin route'larında
 * service-role ile yapılır.
 */
import { getPublicClient } from './supabase/server';
import { ANNOUNCEMENT_TYPES } from '@/types/database';
import type { AnnouncementType, PublicAnnouncement } from '@/types/database';

function logError(fn: string, error: unknown) {
  console.error(`\n[terapimap:announcements] ${fn} failed:`);
  console.error(JSON.stringify(error, null, 2));
}

const ANNOUNCEMENT_PUBLIC_SELECT = `
  id, type, title, description, location_text, is_online, time_label,
  capacity, price_info, image_url, created_at,
  professionals ( id, slug, name, title, image_url, professional_type )
`;

/** /duyurular sayfası için — yayınlanmış tüm duyurular, en yeni önce. */
export async function getPublishedAnnouncements(opts?: {
  type?: AnnouncementType;
}): Promise<PublicAnnouncement[]> {
  const supabase = getPublicClient();
  let query = supabase
    .from('announcements')
    .select(ANNOUNCEMENT_PUBLIC_SELECT)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (opts?.type) query = query.eq('type', opts.type);

  const { data, error } = await query;
  if (error) {
    logError('getPublishedAnnouncements', error);
    return [];
  }

  return (data ?? []).map((row: any) => {
    const { professionals, ...rest } = row;
    return { ...rest, professional: professionals ?? null } as PublicAnnouncement;
  });
}

const MIN_DESCRIPTION_LENGTH = 10;
const MAX_TITLE_LENGTH = 200;
const MAX_TEXT_FIELD_LENGTH = 500;

/**
 * Hem admin hem panel (terapist) formundan gelen gövdeyi doğrular —
 * articles'ın aksine terapist/admin arasında alan farkı yok (is_featured
 * gibi admin-özel bir alan announcements'ta henüz tanımlı değil), bu
 * yüzden tek bir fonksiyon yeterli.
 */
export function validateAnnouncementPayload(
  body: any,
): { error?: string; data?: Record<string, unknown> } {
  const type = String(body.type ?? '').trim();
  const title = String(body.title ?? '').trim();
  const description = String(body.description ?? '').trim();
  const location_text = String(body.location_text ?? '').trim();
  const time_label = String(body.time_label ?? '').trim();
  const price_info = String(body.price_info ?? '').trim();
  const is_online = Boolean(body.is_online);
  const image_url = String(body.image_url ?? '').trim();

  if (!(ANNOUNCEMENT_TYPES as readonly string[]).includes(type)) {
    return { error: 'Geçerli bir duyuru türü seçiniz.' };
  }
  if (!title) return { error: 'Başlık zorunludur.' };
  if (title.length > MAX_TITLE_LENGTH) return { error: 'Başlık çok uzun.' };
  if (!description) return { error: 'Açıklama zorunludur.' };
  if (description.length < MIN_DESCRIPTION_LENGTH) return { error: 'Açıklama çok kısa.' };
  if (location_text.length > MAX_TEXT_FIELD_LENGTH) return { error: 'Yer bilgisi çok uzun.' };
  if (time_label.length > MAX_TEXT_FIELD_LENGTH) return { error: 'Zaman bilgisi çok uzun.' };
  if (price_info.length > MAX_TEXT_FIELD_LENGTH) return { error: 'Fiyat bilgisi çok uzun.' };

  let capacity: number | null = null;
  if (body.capacity !== undefined && body.capacity !== null && body.capacity !== '') {
    const n = Number(body.capacity);
    if (!Number.isInteger(n) || n <= 0) {
      return { error: 'Kontenjan pozitif bir tam sayı olmalı.' };
    }
    capacity = n;
  }

  return {
    data: {
      type,
      title,
      description,
      location_text: location_text || null,
      is_online,
      time_label: time_label || null,
      capacity,
      price_info: price_info || null,
      image_url: image_url || null,
    },
  };
}
