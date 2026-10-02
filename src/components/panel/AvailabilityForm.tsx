'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { XIcon } from '@/components/ui/icons';

type Rule = { id?: string; weekday: number; start_time: string; end_time: string };
type ExceptionRow = { id: string; date: string; note: string | null };

type Props = {
  professionalId: string;
  initialMeetingLink: string;
  initialSessionDuration: number;
  isOnline: boolean;
  isInPerson: boolean;
  initialRules: Rule[];
  initialExceptions: ExceptionRow[];
};

// JS Date.getDay() sırasıyla aynı: 0 = Pazar … 6 = Cumartesi.
// Ekranda Pazartesi'den başlatmak için görüntüleme sırası ayrı tutuluyor.
const DAY_LABELS: Record<number, string> = {
  0: 'Pazar',
  1: 'Pazartesi',
  2: 'Salı',
  3: 'Çarşamba',
  4: 'Perşembe',
  5: 'Cuma',
  6: 'Cumartesi',
};
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const DURATION_OPTIONS = [20, 30, 45, 50, 60, 75, 90, 120];

const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

/**
 * Saat/dakika için iki ayrı <select> — native <input type="time"> yerine.
 * Native input, kullanıcının işletim sistemi/tarayıcı diline göre 12 saatlik
 * (ÖÖ/ÖS) gösterebiliyordu; bu bileşen herkeste aynı, garanti 24 saatlik
 * ("14:30") formatı sağlıyor.
 */
function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [h, m] = value.split(':');
  const minuteValue = MINUTES.includes(m) ? m : '00';

  return (
    <div className="flex items-center gap-1">
      <select
        value={h}
        onChange={(e) => onChange(`${e.target.value}:${minuteValue}`)}
        className="h-10 rounded-lg border border-brand-200 bg-white px-2 text-sm text-brand-900"
        aria-label="Saat"
      >
        {HOURS.map((hh) => (
          <option key={hh} value={hh}>
            {hh}
          </option>
        ))}
      </select>
      <span className="text-brand-400">:</span>
      <select
        value={minuteValue}
        onChange={(e) => onChange(`${h}:${e.target.value}`)}
        className="h-10 rounded-lg border border-brand-200 bg-white px-2 text-sm text-brand-900"
        aria-label="Dakika"
      >
        {MINUTES.map((mm) => (
          <option key={mm} value={mm}>
            {mm}
          </option>
        ))}
      </select>
    </div>
  );
}

type DayState = { enabled: boolean; start: string; end: string };

function buildInitialWeek(rules: Rule[]): Record<number, DayState> {
  const week: Record<number, DayState> = {};
  for (let w = 0; w <= 6; w++) {
    const rule = rules.find((r) => r.weekday === w);
    week[w] = rule
      ? { enabled: true, start: rule.start_time.slice(0, 5), end: rule.end_time.slice(0, 5) }
      : { enabled: false, start: '09:00', end: '18:00' };
  }
  return week;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });
  } catch {
    return iso;
  }
}

export function AvailabilityForm({
  professionalId,
  initialMeetingLink,
  initialSessionDuration,
  isOnline,
  initialRules,
  initialExceptions,
}: Props) {
  const [meetingLink, setMeetingLink] = useState(initialMeetingLink);
  const [sessionDuration, setSessionDuration] = useState(initialSessionDuration);
  const [week, setWeek] = useState<Record<number, DayState>>(() => buildInitialWeek(initialRules));
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  const [exceptions, setExceptions] = useState<ExceptionRow[]>(initialExceptions);
  const [newDate, setNewDate] = useState('');
  const [newNote, setNewNote] = useState('');
  const [exceptionStatus, setExceptionStatus] = useState<'idle' | 'saving'>('idle');
  const [exceptionError, setExceptionError] = useState<string | null>(null);

  function updateDay(weekday: number, patch: Partial<DayState>) {
    setWeek((prev) => ({ ...prev, [weekday]: { ...prev[weekday], ...patch } }));
  }

  const hasTimeError = Object.values(week).some(
    (d) => d.enabled && d.start >= d.end,
  );

  async function handleSave() {
    setSaveStatus('saving');
    setSaveError(null);

    const rules = Object.entries(week)
      .filter(([, d]) => d.enabled)
      .map(([weekday, d]) => ({
        weekday: Number(weekday),
        start_time: d.start,
        end_time: d.end,
      }));

    try {
      const res = await fetch('/api/panel/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_link: meetingLink.trim() || null,
          session_duration_minutes: sessionDuration,
          rules,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? 'failed');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (e: any) {
      setSaveStatus('error');
      setSaveError(e?.message ?? 'Bilinmeyen hata');
    }
  }

  async function handleAddException() {
    if (!newDate) return;
    setExceptionStatus('saving');
    setExceptionError(null);
    try {
      const res = await fetch('/api/panel/availability/exceptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate, note: newNote.trim() || null }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? 'failed');
      setExceptions((prev) =>
        [...prev, json.exception as ExceptionRow].sort((a, b) => a.date.localeCompare(b.date)),
      );
      setNewDate('');
      setNewNote('');
    } catch (e: any) {
      setExceptionError('Eklenemedi: ' + (e?.message ?? 'bilinmeyen hata'));
    } finally {
      setExceptionStatus('idle');
    }
  }

  async function handleRemoveException(id: string) {
    const prev = exceptions;
    setExceptions((cur) => cur.filter((x) => x.id !== id));
    try {
      const res = await fetch(`/api/panel/availability/exceptions?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('failed');
    } catch {
      setExceptions(prev); // geri al
      setExceptionError('Silinemedi, tekrar deneyin.');
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-base font-semibold text-brand-900">Haftalık Çalışma Saatleri</h2>
        <p className="mt-1 text-sm text-brand-500">
          Danışanlar yalnızca burada açık bıraktığınız gün ve saat aralığında randevu
          alabilir. Bir günü kapalı bırakırsanız o gün hiç randevu alınamaz.
        </p>

        <div className="mt-5 space-y-3">
          {DISPLAY_ORDER.map((weekday) => {
            const day = week[weekday];
            return (
              <div
                key={weekday}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/40 p-3"
              >
                <label className="flex w-36 flex-shrink-0 items-center gap-2 text-sm font-medium text-brand-800">
                  <input
                    type="checkbox"
                    checked={day.enabled}
                    onChange={(e) => updateDay(weekday, { enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-500"
                  />
                  {DAY_LABELS[weekday]}
                </label>

                {day.enabled ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-brand-700">
                    <TimeSelect value={day.start} onChange={(v) => updateDay(weekday, { start: v })} />
                    <span className="text-brand-400">—</span>
                    <TimeSelect value={day.end} onChange={(v) => updateDay(weekday, { end: v })} />
                    {day.start >= day.end && (
                      <span className="text-xs text-red-600">Bitiş, başlangıçtan sonra olmalı</span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-brand-400">Kapalı</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 border-t border-brand-100 pt-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-700">
              Seans süresi
            </label>
            <Select
              value={sessionDuration}
              onChange={(e) => setSessionDuration(Number(e.target.value))}
            >
              {DURATION_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} dakika
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-brand-400">
              Randevu saatleri bu süreye göre otomatik hesaplanır.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-700">
              Online görüşme linki {isOnline ? '' : '(opsiyonel)'}
            </label>
            <Input
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/... veya Zoom linkiniz"
            />
            <p className="mt-1 text-xs text-brand-400">
              Online randevu alan danışanlara otomatik olarak bu link iletilir.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-brand-100 pt-5">
          <Button type="button" onClick={handleSave} disabled={saveStatus === 'saving' || hasTimeError}>
            {saveStatus === 'saving' ? 'Kaydediliyor…' : 'Kaydet'}
          </Button>
          {saveStatus === 'saved' && (
            <span className="text-sm font-medium text-green-700">Kaydedildi.</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm font-medium text-red-600">Kaydedilemedi: {saveError}</span>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-base font-semibold text-brand-900">İzin / Tatil Günleri</h2>
        <p className="mt-1 text-sm text-brand-500">
          Haftalık programınız açık olsa bile, belirli bir günü tamamen kapatmak için
          buraya ekleyin (ör. tatil, resmi izin).
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-700">Tarih</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="h-11 rounded-lg border border-brand-200 bg-white px-3 text-sm text-brand-900"
            />
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="mb-1.5 block text-xs font-medium text-brand-700">
              Not (opsiyonel)
            </label>
            <Input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="ör. Yıllık izin"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddException}
            disabled={!newDate || exceptionStatus === 'saving'}
          >
            Ekle
          </Button>
        </div>

        {exceptionError && <p className="mt-2 text-sm text-red-600">{exceptionError}</p>}

        {exceptions.length > 0 && (
          <ul className="mt-5 space-y-2">
            {exceptions.map((ex) => (
              <li
                key={ex.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-brand-100 bg-brand-50/40 px-3.5 py-2.5 text-sm"
              >
                <div>
                  <span className="font-medium text-brand-900">{fmtDate(ex.date)}</span>
                  {ex.note && <span className="ml-2 text-brand-500">— {ex.note}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveException(ex.id)}
                  aria-label="Kaldır"
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-brand-400 hover:bg-brand-100 hover:text-brand-700"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
