'use client';

/**
 * "Mesaj At" butonu — panelde kayıtlı (user_id dolu) terapistler için randevu
 * CTA'sının yanında gösterilen ikincil buton. Paket seviyesinden (booking_tier)
 * bağımsızdır: tek şartı terapistin panel hesabının olması.
 *
 * Modal kabuğu kasıtlı olarak AppointmentBookingButton ile birebir aynı
 * (o bileşendeki dosya başı yorumda anlatılan "backdrop-filter
 * containing-block" hatasından aynı şekilde etkilendiği için aynı çözüm
 * burada da uygulanıyor). İçerik ise LeadForm — source="mesaj" ile, admin
 * /admin/leads listesinde bunun bir randevu değil doğrudan mesaj olduğunu
 * ayırt edebilsin diye.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import LeadForm from '@/components/LeadForm';
import { MessageCircleIcon, XIcon } from '@/components/ui/icons';

type Props = {
  professionalId: string;
  label: string;
  subtitle: string;
  closeLabel: string;
  className?: string;
};

export default function MessageButton({ professionalId, label, subtitle, closeLabel, className = '' }: Props) {
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
        className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white px-5 text-sm font-medium text-brand-800 shadow-soft transition-colors hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${className}`}
      >
        <MessageCircleIcon className="h-[18px] w-[18px]" />
        {label}
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={label}
          >
            <div
              className="absolute inset-0 bg-brand-900/40 backdrop-blur-[2px]"
              onClick={close}
              aria-hidden="true"
            />
            <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
              <div className="flex flex-shrink-0 items-start justify-between gap-4 p-6 pb-4 md:p-7 md:pb-4">
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

              <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 md:px-7 md:pb-7">
                <LeadForm professionalId={professionalId} source="mesaj" />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
