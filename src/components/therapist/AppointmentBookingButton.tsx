'use client';

/**
 * "Randevu Al" butonu + modal — anında (self-servis) randevu alma akışı.
 *
 * Terapist panelde haftalık müsaitlik tanımlamadıysa (availability_rules
 * boşsa) /api/appointments/available-slots boş bir slot listesi döner;
 * bu durumda eski davranışa (LeadForm ile "iletişim talebi" formu)
 * otomatik olarak geri dönülür — hiçbir terapist bu özellik yüzünden
 * randevu alamaz hale gelmez.
 *
 * Modal kabuğu (createPortal + her zaman ortalanmış, kendi içinde
 * kaydırılabilir gövde) kasıtlı olarak AppointmentModalButton ile
 * birebir aynı — o bileşendeki dosya başı yorumda anlatılan
 * "backdrop-filter containing-block" hatasından aynı şekilde etkilendiği
 * için aynı çözüm burada da uygulanıyor.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocale, useTranslations } from 'next-intl';
import LeadForm from '@/components/LeadForm';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CalendarPlusIcon, XIcon } from '@/components/ui/icons';

type Props = {
  professionalId: string;
  label: string;
  subtitle: string;
  closeLabel: string;
  className?: string;
};

type SlotsResponse = {
  sessionDurationMinutes: number;
  isOnline: boolean;
  isInPerson: boolean;
  hasMeetingLink: boolean;
  slots: Record<string, string[]>;
};

type FetchState = 'idle' | 'loading' | 'ready' | 'empty' | 'error';
type Step = 'pick' | 'form' | 'success';
type SessionType = 'online' | 'in_person';

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-brand-400" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-7 w-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function fmtDateChip(dateStr: string, locale: string): { weekday: string; day: string; month: string } {
  const d = new Date(dateStr + 'T12:00:00Z');
  return {
    weekday: d.toLocaleDateString(locale, { weekday: 'short', timeZone: 'UTC' }),
    day: d.toLocaleDateString(locale, { day: '2-digit', timeZone: 'UTC' }),
    month: d.toLocaleDateString(locale, { month: 'short', timeZone: 'UTC' }),
  };
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtFullDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long', timeZone: 'UTC' });
}

export default function AppointmentBookingButton({ professionalId, label, subtitle, closeLabel, className = '' }: Props) {
  const t = useTranslations('booking');
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

  const [fetchState, setFetchState] = useState<FetchState>('idle');
  const [data, setData] = useState<SlotsResponse | null>(null);
  const [visibleDays, setVisibleDays] = useState(7);

  const [step, setStep] = useState<Step>('pick');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<SessionType | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || fetchState !== 'idle') return;
    setFetchState('loading');
    fetch(`/api/appointments/available-slots?professionalId=${professionalId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('failed'))))
      .then((json: SlotsResponse) => {
        setData(json);
        const dateKeys = Object.keys(json.slots ?? {});
        if (dateKeys.length === 0) {
          setFetchState('empty');
          return;
        }
        setFetchState('ready');
        const onlyType: SessionType | null =
          json.isOnline && json.hasMeetingLink && !json.isInPerson
            ? 'online'
            : json.isInPerson && !(json.isOnline && json.hasMeetingLink)
              ? 'in_person'
              : null;
        if (onlyType) setSessionType(onlyType);
      })
      .catch(() => setFetchState('error'));
  }, [open, fetchState, professionalId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, close]);

  function reset() {
    setFetchState('idle');
    setData(null);
    setStep('pick');
    setSelectedDate(null);
    setSelectedSlot(null);
    setSessionType(null);
    setName('');
    setEmail('');
    setPhone('');
    setSubmitStatus('idle');
    setSubmitError(null);
    setVisibleDays(7);
  }

  function handleCloseAndReset() {
    close();
    setTimeout(reset, 300);
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot || !sessionType || !name.trim() || !email.trim()) {
      setSubmitStatus('error');
      setSubmitError(t('validation'));
      return;
    }
    setSubmitStatus('loading');
    setSubmitError(null);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professional_id: professionalId,
          start_at: selectedSlot,
          session_type: sessionType,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json?.error === 'slot_taken') {
          setSubmitError(t('slotTaken'));
          setFetchState('idle'); // yeniden çek
          setStep('pick');
          setSelectedSlot(null);
        } else {
          setSubmitError(t('error'));
        }
        setSubmitStatus('error');
        return;
      }
      setStep('success');
      setSubmitStatus('idle');
    } catch {
      setSubmitStatus('error');
      setSubmitError(t('error'));
    }
  }

  const dateKeys = data ? Object.keys(data.slots).sort() : [];
  const shownDateKeys = dateKeys.slice(0, visibleDays);
  const timesForSelectedDate = selectedDate && data ? data.slots[selectedDate] ?? [] : [];
  const needsSessionTypeChoice = data?.isOnline && data?.hasMeetingLink && data?.isInPerson;

  let body: React.ReactNode;

  if (fetchState === 'loading' || fetchState === 'idle') {
    body = (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <Spinner />
        <p className="text-sm text-brand-500">{t('loading')}</p>
      </div>
    );
  } else if (fetchState === 'empty' || fetchState === 'error') {
    // Terapist henüz müsaitlik tanımlamadı (veya hesaplama başarısız oldu) —
    // eski "iletişim talebi" formuna sorunsuzca geri dön.
    body = <LeadForm professionalId={professionalId} />;
  } else if (step === 'success') {
    body = (
      <div className="flex flex-col items-center gap-5 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 text-accent-700">
          <CheckIcon />
        </div>
        <div>
          <p className="text-base font-semibold text-brand-900">{t('successTitle')}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-brand-600">{t('success', { email })}</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="text-xs font-medium text-brand-500 underline-offset-2 hover:text-brand-700 hover:underline"
        >
          {t('bookAnother')}
        </button>
      </div>
    );
  } else if (step === 'form') {
    body = (
      <form onSubmit={handleConfirm} noValidate>
        <div className="mb-4 rounded-xl border border-brand-100 bg-brand-50/50 p-3.5 text-sm text-brand-800">
          <p className="font-semibold text-brand-900">{t('selectedSummary')}</p>
          <p className="mt-0.5">
            {selectedDate && fmtFullDate(selectedDate, locale)} · {selectedSlot && fmtTime(selectedSlot)}
          </p>
        </div>

        {needsSessionTypeChoice && (
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-brand-700">{t('sessionType')}</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSessionType('online')}
                className={`h-10 flex-1 rounded-lg border text-sm font-medium transition-colors ${
                  sessionType === 'online'
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-brand-200 bg-white text-brand-700 hover:bg-brand-50'
                }`}
              >
                {t('sessionTypeOnline')}
              </button>
              <button
                type="button"
                onClick={() => setSessionType('in_person')}
                className={`h-10 flex-1 rounded-lg border text-sm font-medium transition-colors ${
                  sessionType === 'in_person'
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-brand-200 bg-white text-brand-700 hover:bg-brand-50'
                }`}
              >
                {t('sessionTypeInPerson')}
              </button>
            </div>
          </div>
        )}

        <fieldset
          disabled={submitStatus === 'loading'}
          className="space-y-4 transition-opacity disabled:pointer-events-none disabled:opacity-50"
        >
          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-700">
              {t('name')} <span className="text-red-400" aria-hidden>*</span>
            </label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-700">
              {t('email')} <span className="text-red-400" aria-hidden>*</span>
            </label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-brand-700">{t('phone')}</label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
          </div>
        </fieldset>

        {submitStatus === 'error' && submitError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button type="button" variant="outline" onClick={() => setStep('pick')} disabled={submitStatus === 'loading'}>
            {t('back')}
          </Button>
          <Button type="submit" disabled={submitStatus === 'loading'} className="flex-1">
            {submitStatus === 'loading' ? t('confirming') : t('confirm')}
          </Button>
        </div>
      </form>
    );
  } else {
    // step === 'pick'
    body = (
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-400">{t('chooseDate')}</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {shownDateKeys.map((date) => {
            const chip = fmtDateChip(date, locale);
            const active = date === selectedDate;
            return (
              <button
                key={date}
                type="button"
                onClick={() => {
                  setSelectedDate(date);
                  setSelectedSlot(null);
                }}
                className={`flex h-16 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl border text-xs font-medium transition-colors ${
                  active
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-brand-200 bg-white text-brand-700 hover:bg-brand-50'
                }`}
              >
                <span className="capitalize">{chip.weekday}</span>
                <span className="mt-0.5 text-sm font-semibold">{chip.day}</span>
                <span className="capitalize">{chip.month}</span>
              </button>
            );
          })}
          {dateKeys.length > visibleDays && (
            <button
              type="button"
              onClick={() => setVisibleDays((d) => d + 7)}
              className="flex h-16 w-14 flex-shrink-0 items-center justify-center rounded-xl border border-dashed border-brand-200 text-xs text-brand-500 hover:bg-brand-50"
            >
              +{Math.min(7, dateKeys.length - visibleDays)}
            </button>
          )}
        </div>

        {selectedDate && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-400">{t('chooseTime')}</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {timesForSelectedDate.map((iso) => (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelectedSlot(iso)}
                  className={`h-10 rounded-lg border text-sm font-medium transition-colors ${
                    selectedSlot === iso
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-brand-200 bg-white text-brand-700 hover:bg-brand-50'
                  }`}
                >
                  {fmtTime(iso)}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button
          type="button"
          className="mt-6 w-full"
          disabled={!selectedSlot}
          onClick={() => setStep('form')}
        >
          {t('confirm')}
        </Button>
      </div>
    );
  }

  const modalTitle = fetchState === 'empty' || fetchState === 'error' ? label : t('cta');
  const modalSubtitle = fetchState === 'empty' || fetchState === 'error' ? subtitle : t('subtitle');

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-brand-700 active:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${className}`}
      >
        <CalendarPlusIcon className="h-[18px] w-[18px]" />
        {label}
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={modalTitle}
          >
            <div
              className="absolute inset-0 bg-brand-900/40 backdrop-blur-[2px]"
              onClick={handleCloseAndReset}
              aria-hidden="true"
            />
            <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
              <div className="flex flex-shrink-0 items-start justify-between gap-4 p-6 pb-4 md:p-7 md:pb-4">
                <div>
                  <h3 className="text-lg font-semibold text-brand-900">{modalTitle}</h3>
                  <p className="mt-1 text-sm text-brand-600">{modalSubtitle}</p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={handleCloseAndReset}
                  aria-label={closeLabel}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-brand-500 transition-colors hover:bg-brand-50 hover:text-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 md:px-7 md:pb-7">{body}</div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
