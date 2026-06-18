'use client';

import { useState } from 'react';
import Image from 'next/image';

type AvatarSize = 'sm' | 'md' | 'lg';

const SIZE: Record<AvatarSize, { outer: string; text: string }> = {
  sm: { outer: 'h-10 w-10 text-sm',  text: 'text-sm' },
  md: { outer: 'h-14 w-14 text-base', text: 'text-base' },
  lg: { outer: 'h-20 w-20 text-xl',   text: 'text-xl' },
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

export default function Avatar({
  name,
  slug: _slug,
  photoUrl,
  size = 'md',
}: {
  name: string;
  slug?: string;
  photoUrl?: string | null;
  size?: AvatarSize;
}) {
  const [imgError, setImgError] = useState(false);

  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const { outer, text } = SIZE[size];
  const hasPhoto = photoUrl && !imgError;

  if (hasPhoto) {
    return (
      <div className={`relative flex-shrink-0 overflow-hidden rounded-full ${outer}`}>
        <Image
          src={photoUrl}
          alt={name}
          fill
          sizes="80px"
          className="object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex-shrink-0 overflow-hidden rounded-full ${getColor(name)} ${outer} flex items-center justify-center`}
    >
      <span className={`font-semibold text-white ${text}`}>
        {initials}
      </span>
    </div>
  );
}
