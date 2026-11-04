'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

/**
 * Kapak görselini yalnızca kutu ekrana yaklaşınca yükler (IntersectionObserver, 300 px pay).
 *
 * Neden: rehber kapakları ham (unoptimized) Supabase JPEG'i, 0,7–2,5 MB. Tarayıcının yerel
 * `loading="lazy"` eşiği (yavaş bağlantıda ~2.500 px) ana sayfada ilk kartı hemen yüklüyor ve
 * açılış görseliyle yarışarak LCP'yi 3,2 → 5,0 sn'ye çıkarmıştı. Sunucu çıktısında yalnızca
 * yer tutucu kutu gelir (görsel DOM'da yok); JS açılınca ve kutu görünür olunca yüklenir.
 */
export default function DeferredCover({
  src,
  alt,
  sizes,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = boxRef.current;
    if (!el || near) return;
    if (typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '300px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);

  return (
    <div ref={boxRef} className="absolute inset-0">
      {near && <Image src={src} alt={alt} fill unoptimized sizes={sizes} className={className} />}
    </div>
  );
}
