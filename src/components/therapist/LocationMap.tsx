'use client';

/**
 * Lazy-loaded Google Maps embed.
 *
 * Core Web Vitals koruması: iframe ilk render'da ASLA yüklenmez.
 * Yüklenme koşulları:
 *   1. Bölüm viewport'a yaklaşınca (IntersectionObserver, 200px rootMargin), veya
 *   2. Kullanıcı "Haritayı Göster" butonuna tıklayınca.
 * Sabit yükseklikli placeholder sayesinde layout shift (CLS) oluşmaz.
 */

import { useEffect, useRef, useState } from 'react';
import { MapPinIcon } from '@/components/ui/icons';

type Props = {
  embedUrl: string;
  /** iframe title — ekran okuyucular için. */
  title: string;
  showMapLabel: string;
};

export default function LocationMap({ embedUrl, title, showMapLabel }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (showMap) return;
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShowMap(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [showMap]);

  return (
    <div
      ref={containerRef}
      className="relative h-64 w-full overflow-hidden rounded-xl border border-brand-100 bg-brand-50 md:h-80"
    >
      {showMap ? (
        <iframe
          src={embedUrl}
          title={title}
          className="h-full w-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.9)_0%,_rgba(255,255,255,0.4)_100%)]">
          {/* Dekoratif harita dokusu */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full text-brand-200/60"
            aria-hidden="true"
          >
            <defs>
              <pattern id="map-grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M48 0H0v48" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#map-grid)" />
          </svg>
          <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-soft ring-1 ring-brand-100">
            <MapPinIcon className="h-6 w-6 text-brand-600" />
          </span>
          <button
            type="button"
            onClick={() => setShowMap(true)}
            className="relative inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 text-sm font-medium text-white shadow-soft transition-colors hover:bg-brand-700 active:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            {showMapLabel}
          </button>
        </div>
      )}
    </div>
  );
}
