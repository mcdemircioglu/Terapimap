'use client';

import { useEffect, useRef } from 'react';
import { useCookieConsent } from './CookieConsentProvider';

/**
 * İzin bazlı script yükleyici (opt-in).
 *
 * - Google Analytics: yalnızca ANALİTİK izni verildiyse yüklenir.
 *   Ortam değişkeni: NEXT_PUBLIC_GA_ID (ör. G-XXXXXXXXXX)
 * - Meta Pixel: yalnızca PAZARLAMA izni verildiyse yüklenir.
 *   Ortam değişkeni: NEXT_PUBLIC_META_PIXEL_ID
 *
 * İlgili env tanımlı değilse hiçbir şey yüklenmez. Scriptler bir kez
 * yüklenir; izin sonradan kaldırılırsa yeni sayfa yüklemesinde artık
 * yüklenmezler.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean };
    _fbq?: unknown;
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

function loadGoogleAnalytics(gaId: string) {
  if (document.getElementById('ga-script')) return;

  window.dataLayer = window.dataLayer ?? [];
  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  // IP anonimleştirme — KVKK açısından veri minimizasyonu.
  gtag('config', gaId, { anonymize_ip: true });

  const script = document.createElement('script');
  script.id = 'ga-script';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
  document.head.appendChild(script);
}

function loadMetaPixel(pixelId: string) {
  if (document.getElementById('meta-pixel-script') || window.fbq) return;

  const fbq: Window['fbq'] = function (...args: unknown[]) {
    (fbq!.queue = fbq!.queue ?? []).push(args);
  };
  fbq.loaded = true;
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement('script');
  script.id = 'meta-pixel-script';
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

export default function ConsentScripts() {
  const { consent, hasChoice, isReady } = useCookieConsent();
  const gaLoaded = useRef(false);
  const pixelLoaded = useRef(false);

  useEffect(() => {
    if (!isReady || !hasChoice) return;

    if (consent.analytics && GA_ID && !gaLoaded.current) {
      gaLoaded.current = true;
      loadGoogleAnalytics(GA_ID);
    }
    if (consent.marketing && META_PIXEL_ID && !pixelLoaded.current) {
      pixelLoaded.current = true;
      loadMetaPixel(META_PIXEL_ID);
    }
  }, [isReady, hasChoice, consent.analytics, consent.marketing]);

  return null;
}
