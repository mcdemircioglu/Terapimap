/**
 * Randevu sistemi için zaman yardımcıları.
 *
 * Türkiye 2016'dan beri yaz saati uygulamıyor, yılın her günü UTC+3 sabit
 * (Europe/Istanbul). Bu yüzden takvim hesaplarını (müsaitlik kurallarının
 * "yerel" saat/gün bilgisini appointments.start_at'teki UTC timestamp'e
 * çevirmek) ICU/Intl zaman dilimi tablosuna bağımlı olmadan, sabit bir
 * offset ile yapabiliyoruz. Bu varsayım değişirse (Türkiye yaz saatine
 * dönerse) burası güncellenmeli.
 */
export const ISTANBUL_OFFSET_MINUTES = 180;

/** "YYYY-MM-DD" + "HH:MM" (İstanbul yerel saati) → UTC ISO string. */
export function istanbulLocalToUtcIso(dateStr: string, timeStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, min] = timeStr.split(':').map(Number);
  const utcMs = Date.UTC(y, m - 1, d, h, min) - ISTANBUL_OFFSET_MINUTES * 60_000;
  return new Date(utcMs).toISOString();
}

/** UTC ISO string'e dakika ekler, yeni UTC ISO string döner. */
export function addMinutesIso(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

/** UTC ISO string → İstanbul yerel saatindeki "YYYY-MM-DD" ve "HH:MM". */
export function utcIsoToIstanbulLocal(iso: string): { date: string; time: string } {
  const ms = new Date(iso).getTime() + ISTANBUL_OFFSET_MINUTES * 60_000;
  const d = new Date(ms);
  const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  const time = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  return { date, time };
}

/** Şu anın İstanbul yerel tarihi, "YYYY-MM-DD". */
export function istanbulToday(): string {
  return utcIsoToIstanbulLocal(new Date().toISOString()).date;
}

/** "YYYY-MM-DD" tarihine gün ekler, yine "YYYY-MM-DD" döner. */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

/**
 * JS Date.getDay() ile aynı sırada (0=Pazar…6=Cumartesi) haftanın gününü
 * döner — "YYYY-MM-DD" bir İstanbul takvim günü olarak yorumlanır (saat
 * bileşeni olmadığından UTC/yerel ayrımı burada sorun yaratmaz).
 */
export function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}
