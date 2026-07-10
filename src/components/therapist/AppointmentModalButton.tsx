'use client';

/**
 * "Randevu Talebi Oluştur" butonu + modal.
 * Modal, sağ sütundaki iletişim formunun birebir aynısını (LeadForm) açar —
 * aynı /api/leads endpoint'i, aynı doğrulama, aynı başarı ekranı.
 * ESC, arka plana tıklama ve ✕ ile kapanır; açıkken body scroll kilitlenir.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import LeadForm from '@/components/LeadForm';
import { CalendarPlusIcon, XIcon } from '@/components/ui/icons';

type Props = {
  professionalId: string;
  label: string;
  subtitle: string;
  closeLabel: string;
};

export default function AppointmentModalButton({
  professionalId,
  label,
  subtitle,
  closeLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-brand-700 active:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        <CalendarPlusIcon className="h-[18px] w-[18px]" />
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={label}
        >
          {/* Arka plan */}
          <div
            className="absolute inset-0 bg-brand-900/40 backdrop-blur-[2px]"
            onClick={close}
            aria-hidden="true"
          />

          {/* Panel */}
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-brand-900">{label}</h3>
                <p className="mt-1 text-sm text-brand-600">{subtitle}</p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={close}
                aria-label={closeLabel}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-brand-500 transition-colors hover:bg-brand-50 hover:text-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5">
              <LeadForm professionalId={professionalId} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
