'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import TherapistCard from '../TherapistCard';
import type { ProfessionalWithSpecialties } from '@/types/database';

/**
 * Ana sayfa "Öne Çıkan Terapistler" slider'ı.
 * Masaüstü 3, tablet 2, mobil 1 kart gösterir; ~5 sn'de bir otomatik
 * sonraki gruba geçer (döngüsel). Ok + nokta kontrolleri, hover'da durur.
 * Kartlara parmakla/mouse ile dokunup sürükleyerek de (swipe) geçilebilir.
 * Grup sayısı 1 ise kontroller gizlenir.
 */
export default function FeaturedTherapistsSlider({
  therapists,
  locale,
  intervalMs = 5000,
}: {
  therapists: ProfessionalWithSpecialties[];
  locale: string;
  intervalMs?: number;
}) {
  const [perView, setPerView] = useState(3);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);

  // Swipe/drag durumu
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const pointerStartX = useRef(0);
  const activePointerId = useRef<number | null>(null);
  const didDrag = useRef(false);

  // Responsive perView: <768 =1, 768-1023 =2, >=1024 =3
  useEffect(() => {
    const mqTablet = window.matchMedia('(min-width: 768px)');
    const mqDesktop = window.matchMedia('(min-width: 1024px)');
    const compute = () => setPerView(mqDesktop.matches ? 3 : mqTablet.matches ? 2 : 1);
    compute();
    mqTablet.addEventListener('change', compute);
    mqDesktop.addEventListener('change', compute);
    return () => {
      mqTablet.removeEventListener('change', compute);
      mqDesktop.removeEventListener('change', compute);
    };
  }, []);

  const pages = Math.max(1, Math.ceil(therapists.length / perView));

  // perView değişince taşan sayfayı sınırla
  useEffect(() => {
    setPage((p) => (p >= pages ? 0 : p));
  }, [pages]);

  // Otomatik geçiş
  useEffect(() => {
    if (pages <= 1 || paused) return;
    const id = setInterval(() => setPage((p) => (p + 1) % pages), intervalMs);
    return () => clearInterval(id);
  }, [pages, paused, intervalMs]);

  const go = (p: number) => setPage(((p % pages) + pages) % pages);

  const trackStyle = useMemo(
    () => ({ transform: `translateX(calc(-${page * 100}% + ${dragOffset}px))` }),
    [page, dragOffset],
  );

  const showControls = pages > 1;
  const prevLabel = locale === 'tr' ? 'Önceki' : 'Previous';
  const nextLabel = locale === 'tr' ? 'Sonraki' : 'Next';

  // ── Sürükle/kaydır (touch + mouse, Pointer Events ile tek elden) ──
  function onPointerDown(e: React.PointerEvent) {
    if (pages <= 1) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pointerStartX.current = e.clientX;
    activePointerId.current = e.pointerId;
    didDrag.current = false;
    setIsDragging(true);
    setPaused(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (activePointerId.current !== e.pointerId) return;
    const delta = e.clientX - pointerStartX.current;
    if (Math.abs(delta) > 4) didDrag.current = true;
    setDragOffset(delta);
  }

  function endDrag() {
    const width = windowRef.current?.clientWidth ?? 0;
    const threshold = width * 0.18; // genişliğin ~%18'i kadar sürüklenince sayfa değişir
    if (width > 0) {
      if (dragOffset <= -threshold) go(page + 1);
      else if (dragOffset >= threshold) go(page - 1);
    }
    setDragOffset(0);
    setIsDragging(false);
    setPaused(false);
    activePointerId.current = null;
  }

  function onPointerUp(e: React.PointerEvent) {
    if (activePointerId.current !== e.pointerId) return;
    endDrag();
  }

  function onPointerCancel(e: React.PointerEvent) {
    if (activePointerId.current !== e.pointerId) return;
    endDrag();
  }

  // Gerçek bir sürükleme olduysa, bırakılan yerdeki tıklamayı (ör. "Profili gör"
  // linki) iptal et — yoksa sürükleme sonu yanlışlıkla profile yönlendirir.
  function onClickCapture(e: React.MouseEvent) {
    if (didDrag.current) {
      e.preventDefault();
      e.stopPropagation();
      didDrag.current = false;
    }
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Görüntü penceresi — swipe/drag alanı: dikey scroll (pan-y) serbest,
          yatay hareketi biz yönetiyoruz. */}
      <div
        ref={windowRef}
        className={`overflow-hidden ${pages > 1 ? 'cursor-grab touch-pan-y active:cursor-grabbing' : ''} ${
          isDragging ? 'select-none' : ''
        }`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
      >
        <div
          className={`flex ease-out ${isDragging ? '' : 'transition-transform duration-500'}`}
          style={trackStyle}
        >
          {therapists.map((t) => (
            <div
              key={t.id}
              className="w-full flex-shrink-0 px-2.5 md:w-1/2 lg:w-1/3"
            >
              <TherapistCard therapist={t} locale={locale} />
            </div>
          ))}
        </div>
      </div>

      {showControls && (
        <>
          {/* Oklar */}
          <button
            type="button"
            aria-label={prevLabel}
            onClick={() => go(page - 1)}
            className="absolute -left-2 top-[42%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-brand-100 bg-white text-brand-700 shadow-soft transition hover:bg-brand-50 md:flex lg:-left-4"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={nextLabel}
            onClick={() => go(page + 1)}
            className="absolute -right-2 top-[42%] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-brand-100 bg-white text-brand-700 shadow-soft transition hover:bg-brand-50 md:flex lg:-right-4"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>

          {/* Noktalar */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i + 1}. grup`}
                aria-current={i === page}
                onClick={() => go(i)}
                className={`h-2.5 rounded-full transition-all ${
                  i === page ? 'w-6 bg-brand-700' : 'w-2.5 bg-brand-200 hover:bg-brand-300'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
