'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Mobilde uzun içeriği kısaltıp "Tümünü göster" ile açan sarmalayıcı (md ve üstünde hiç kısaltmaz).
 * İçerik DOM'da tam olarak durur (yalnızca CSS ile kırpılır), arama motorları ve ekran okuyucular
 * metnin tamamını görür. İçerik kısaltma sınırından kısaysa ne bulanıklık ne de düğme gösterilir.
 *
 * Kullanım nedeni: profilde uzmanlık etiketleri ve "Hakkında" metni ~2.200 px yer kaplıyor,
 * görüşme türü ve ücret bilgisi 3-4 ekran aşağıda kalıyordu.
 *
 * Düzen kayması (CLS): kırpılmış durumda düğme, içeriğin altına eklenmek yerine kırpılan kutunun
 * alt kenarına bindirilir. Ölçüm sonrası düğme görününce yer kaplamadığı için altındaki içerik
 * aşağı itilmez (canlıda düğme ayrı satır olarak eklendiğinde CLS 0 → 0,06 olmuştu).
 */
const COLLAPSED = {
  sm: 'max-h-48',
  md: 'max-h-60',
} as const;

export default function ExpandableSection({
  children,
  size = 'md',
  showLabel = 'Tümünü göster',
  hideLabel = 'Daha az göster',
}: {
  children: React.ReactNode;
  size?: keyof typeof COLLAPSED;
  showLabel?: string;
  hideLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;
    // Kısaltılmış durumdayken içerik kutudan uzunsa düğme gösterilir (md+ ta kısaltma yok, hep false)
    const check = () => setOverflowing(el.scrollHeight > el.clientHeight + 4);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [expanded]);

  const clipped = !expanded;

  return (
    <div>
      <div className="relative">
        <div
          ref={ref}
          className={clipped ? `${COLLAPSED[size]} overflow-hidden md:max-h-none md:overflow-visible` : ''}
        >
          {children}
        </div>
        {clipped && overflowing && (
          <div className="absolute inset-x-0 bottom-0 flex h-14 items-end bg-gradient-to-t from-white via-white/90 to-transparent md:hidden">
            <button
              type="button"
              aria-expanded={false}
              onClick={() => setExpanded(true)}
              className="inline-flex h-11 items-center text-sm font-medium text-brand-700 underline underline-offset-2 hover:text-brand-900"
            >
              {showLabel}
            </button>
          </div>
        )}
      </div>
      {expanded && (
        <button
          type="button"
          aria-expanded
          onClick={() => setExpanded(false)}
          className="mt-1 inline-flex h-11 items-center text-sm font-medium text-brand-700 underline underline-offset-2 hover:text-brand-900 md:hidden"
        >
          {hideLabel}
        </button>
      )}
    </div>
  );
}
