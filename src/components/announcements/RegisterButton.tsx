'use client';

/**
 * "Kayıt Ol" butonu — /duyurular sayfasındaki her kartın altında.
 * ReviewButton ile birebir aynı modal kabuk deseni.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import RegisterForm from '@/components/announcements/RegisterForm';
import { XIcon } from '@/components/ui/icons';

type Props = {
  announcementId: string;
  title: string;
  label: string;
  subtitle: string;
  closeLabel: string;
  className?: string;
};

export default function RegisterButton({ announcementId, title, label, subtitle, closeLabel, className = '' }: Props) {
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
        className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${className}`}
      >
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
                  <h3 className="text-lg font-semibold text-brand-900">{title}</h3>
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
                <RegisterForm announcementId={announcementId} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
