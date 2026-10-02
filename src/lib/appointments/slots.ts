import { addDays, istanbulLocalToUtcIso, weekdayOf } from './time';

export type AvailabilityRuleRow = { weekday: number; start_time: string; end_time: string };
export type AvailabilityExceptionRow = {
  date: string;
  is_closed: boolean;
  start_time: string | null;
  end_time: string | null;
};
export type ExistingAppointment = { start_at: string; end_at: string };

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Bir terapist için, verilen tarih aralığında müsait randevu başlangıç
 * saatlerini hesaplar. Hem /api/appointments/available-slots (listeleme)
 * hem de /api/appointments POST (rezervasyon anında yeniden doğrulama)
 * tarafından kullanılır — iki yerde ayrı mantık yazıp birbirinden
 * sapmasını önlemek için ortak bu fonksiyon.
 *
 * Döndürülen saatler UTC ISO string (appointments.start_at ile doğrudan
 * karşılaştırılabilir/kaydedilebilir).
 */
export function computeAvailableSlots(params: {
  sessionDurationMinutes: number;
  rules: AvailabilityRuleRow[];
  exceptions: AvailabilityExceptionRow[];
  existingAppointments: ExistingAppointment[];
  fromDate: string; // "YYYY-MM-DD" (İstanbul yerel)
  days: number;
  minLeadMinutes: number;
}): Record<string, string[]> {
  const { sessionDurationMinutes, rules, exceptions, existingAppointments, fromDate, days, minLeadMinutes } = params;

  const nowMs = Date.now();
  const minStartMs = nowMs + minLeadMinutes * 60_000;
  const busy = existingAppointments.map((a) => ({
    start: new Date(a.start_at).getTime(),
    end: new Date(a.end_at).getTime(),
  }));

  const result: Record<string, string[]> = {};

  for (let i = 0; i < days; i++) {
    const date = addDays(fromDate, i);
    const exception = exceptions.find((e) => e.date === date);

    let windows: { start: string; end: string }[];
    if (exception) {
      if (exception.is_closed || !exception.start_time || !exception.end_time) continue;
      windows = [{ start: exception.start_time, end: exception.end_time }];
    } else {
      const weekday = weekdayOf(date);
      windows = rules
        .filter((r) => r.weekday === weekday)
        .map((r) => ({ start: r.start_time, end: r.end_time }));
    }
    if (windows.length === 0) continue;

    const daySlots: string[] = [];
    for (const w of windows) {
      const startMin = toMinutes(w.start);
      const endMin = toMinutes(w.end);
      for (let cursor = startMin; cursor + sessionDurationMinutes <= endMin; cursor += sessionDurationMinutes) {
        const slotStartIso = istanbulLocalToUtcIso(date, fromMinutes(cursor));
        const slotStartMs = new Date(slotStartIso).getTime();
        if (slotStartMs < minStartMs) continue;

        const slotEndMs = slotStartMs + sessionDurationMinutes * 60_000;
        const overlaps = busy.some((b) => b.start < slotEndMs && b.end > slotStartMs);
        if (overlaps) continue;

        daySlots.push(slotStartIso);
      }
    }

    if (daySlots.length > 0) {
      result[date] = daySlots.sort();
    }
  }

  return result;
}
