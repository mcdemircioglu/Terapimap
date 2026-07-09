'use client';

import { useLocale } from 'next-intl';
import { useCookieConsent } from './CookieConsentProvider';

/**
 * Sayfa altında görünen çerez izin bandı.
 * Kullanıcı bir tercih verene kadar gösterilir; tercih sonrası bir daha çıkmaz.
 */
export default function CookieBanner() {
  const { isReady, hasChoice, acceptAll, rejectAll, openModal } = useCookieConsent();
  const locale = useLocale();

  // Hydration tamamlanmadan veya tercih verilmişse gösterme.
  if (!isReady || hasChoice) return null;

  return (
    <div
      role="dialog"
      aria-label="Çerez izni"
      className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4"
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-brand-200 bg-white p-4 shadow-xl sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm leading-relaxed text-brand-800">
            <span className="font-semibold">Çerez kullanımı:</span>{' '}
            Sitemizde zorunlu çerezlerin yanı sıra, izniniz olması hâlinde
            analitik ve pazarlama çerezleri kullanılmaktadır. Ayrıntılar için{' '}
            <a
              href={`/${locale}/cerez-politikasi`}
              className="underline hover:text-brand-900"
            >
              Çerez Politikası
            </a>
            &apos;nı inceleyebilirsiniz.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-shrink-0">
            <button
              type="button"
              onClick={openModal}
              className="rounded-xl border border-brand-300 bg-white px-4 py-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
            >
              Tercihlerimi Yönet
            </button>
            <button
              type="button"
              onClick={rejectAll}
              className="rounded-xl border border-brand-300 bg-white px-4 py-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
            >
              Tümünü Reddet
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Tümünü Kabul Et
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
