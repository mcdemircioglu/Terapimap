'use client';

import { useState } from 'react';
import Image from 'next/image';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE: Record<AvatarSize, { outer: string; text: string; px: number; badge: string }> = {
  sm: { outer: 'h-10 w-10',  text: 'text-sm',  px: 40,  badge: 'w-3.5 h-3.5 border' },
  md: { outer: 'h-16 w-16',  text: 'text-base', px: 64,  badge: 'w-4 h-4 border' },
  lg: { outer: 'h-24 w-24',  text: 'text-xl',  px: 96,  badge: 'w-5 h-5 border-2' },
  xl: { outer: 'h-32 w-32',  text: 'text-2xl', px: 128, badge: 'w-6 h-6 border-2' },
};

// İsmin baş harfine göre tutarlı renk
const COLORS = [
  'bg-teal-600',
  'bg-emerald-600',
  'bg-cyan-700',
  'bg-slate-600',
  'bg-violet-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-indigo-600',
];

function getColor(name: string): string {
  const code = name.charCodeAt(0) + (name.charCodeAt(1) ?? 0);
  return COLORS[code % COLORS.length];
}

// Terapimap yeşili onay rozeti
function VerifiedBadge({ className }: { className: string }) {
  return (
    <span
      className={`absolute bottom-0 right-0 flex items-center justify-center rounded-full bg-[#1a8a6e] border-white ${className}`}
      title="Doğrulandı"
    >
      <svg viewBox="0 0 12 12" fill="none" className="w-[65%] h-[65%]">
        <path
          d="M2 6l3 3 5-5"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function Avatar({
  name,
  slug: _slug,
  photoUrl,
  size = 'md',
  verified = false,
}: {
  name: string;
  slug?: string;
  photoUrl?: string | null;
  size?: AvatarSize;
  verified?: boolean;
}) {
  const [imgError, setImgError] = useState(false);

  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const { outer, text, px, badge } = SIZE[size];
  const hasPhoto = photoUrl && !imgError;

  if (hasPhoto) {
    return (
      <div className={`relative flex-shrink-0 ${outer}`}>
        <div className="relative w-full h-full overflow-hidden rounded-full">
          <Image
            src={photoUrl}
            alt={name}
            fill
            sizes={`${px * 2}px`}
            className="object-cover"
            quality={90}
            onError={() => setImgError(true)}
          />
        </div>
        {verified && <VerifiedBadge className={badge} />}
      </div>
    );
  }

  return (
    <div className={`relative flex-shrink-0 ${outer}`}>
      <div
        className={`w-full h-full overflow-hidden rounded-full ${getColor(name)} flex items-center justify-center`}
      >
        <span className={`font-semibold text-white ${text}`}>
          {initials}
        </span>
      </div>
      {verified && <VerifiedBadge className={badge} />}
    </div>
  );
}
