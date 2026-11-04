import { Children } from 'react';

/**
 * Mobilde (sm altı) kartları yatay kaydırmalı şeride çevirir, sm ve üstünde eski ızgara
 * (sm: 2, lg: 3 sütun) olarak kalır. Ana sayfada testler ve rehber kartları mobilde alt alta
 * ~4.000 px yer kaplıyordu; sonraki kartın bir kısmı görünür kalarak kaydırılabilirliği belli eder.
 * Server component: kartlar DOM'da yan yana durur, arama motorları hepsini görür.
 */
const GAP = { sm: 'gap-4', md: 'gap-6' } as const;

export default function MobileCarousel({
  children,
  gap = 'sm',
  label,
}: {
  children: React.ReactNode;
  gap?: keyof typeof GAP;
  /** Kaydırılabilir bölgenin ekran okuyucu adı */
  label?: string;
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={`-mx-4 flex snap-x snap-mandatory ${GAP[gap]} overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3`}
    >
      {Children.map(children, (child) => (
        <div className="flex w-[82%] shrink-0 snap-start sm:w-auto">{child}</div>
      ))}
    </div>
  );
}
