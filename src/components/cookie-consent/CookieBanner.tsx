'use client';

import { useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { useCookieConsent } from './CookieConsentProvider';

/**
 * Sayfa altında görünen çerez izin bandı.
 * Kullanıcı bir tercih verene kadar gösterilir; tercih sonrası bir daha çıkmaz.
 *
 * Mobilde kompakt: önceden üç tam genişlikli buton üst üste ekranın ~%37'sini (304 px) kaplıyor,
 * ana sayfadaki "Terapistleri ara" butonunu ve profildeki sabit randevu çubuğunu örtüyordu.
 * Şimdi "Reddet" ve "Kabul Et" yan yana, "Tercihlerimi Yönet" alt satırda bağlantı görünümünde.
 * Reddet/Kabul Et butonlarının boyutu eşit tutuldu. İzin mantığı değişmedi.
 */
export default function CookieBanner() {
  const { isReady, hasChoice, acceptAll, rejectAll, openModal } = useCookieConsent();
  const locale = useLocale();
  const ref = useRef<HTMLDivElement>(null);

  // Hydration tamamlanmadan veya tercih verilmişse gösterme.
  const visible = isReady && !hasChoice;

  // Bant yüksekliğini --cookie-banner-h olarak yayınla: profildeki sabit randevu çubuğu
  // bantın üstüne oturur, böylece bant açıkken ana buton örtülmez.
  useEffect(() => {
    const el = ref.current;
    if (!visible || !el) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty('--cookie-banner-h', `${el.offsetHeight}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty('--cookie-banner-h');
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Çerez izni"
      className="fixed inset-x-0 bottom-0 z-50 p-2 sm:p-4"
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-brand-200 bg-white p-3 shadow-xl sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          <p className="text-xs leading-snug text-brand-800 sm:text-sm sm:leading-relaxed">
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
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:flex-shrink-0">
            <button
              type="button"
              onClick={openModal}
              className="order-last col-span-2 rounded-lg px-2 py-2.5 text-xs font-medium text-brand-700 underline underline-offset-2 hover:text-brand-900 sm:order-none sm:col-span-1 sm:rounded-xl sm:border sm:border-brand-300 sm:bg-white sm:px-4 sm:py-2.5 sm:text-sm sm:no-underline sm:transition-colors sm:hover:bg-brand-50"
            >
              Tercihlerimi Yönet
            </button>
            <button
              type="button"
              onClick={rejectAll}
              className="rounded-xl border border-brand-300 bg-white px-3 py-3 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 sm:px-4 sm:py-2.5"
            >
              Tümünü Reddet
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="rounded-xl bg-brand-600 px-3 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 sm:px-4 sm:py-2.5"
            >
              Tümünü Kabul Et
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
