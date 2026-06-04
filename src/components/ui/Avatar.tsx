'use client';

import { useState } from 'react';
import Image from 'next/image';

const DEFAULT_AVATAR = '/images/default-therapist-avatar.svg';

type AvatarSize = 'sm' | 'md' | 'lg';

const SIZE: Record<AvatarSize, { outer: string; text: string }> = {
  sm: { outer: 'h-10 w-10 text-sm',  text: 'text-sm' },
  md: { outer: 'h-14 w-14 text-base', text: 'text-base' },
  lg: { outer: 'h-20 w-20 text-xl',   text: 'text-xl' },
};

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

  const src = (!imgError && photoUrl) ? photoUrl : DEFAULT_AVATAR;
  const showImage = !imgError || src === DEFAULT_AVATAR;

  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');

  const { outer, text } = SIZE[size];

  return (
    <div
      className={`relative flex-shrink-0 overflow-hidden rounded-full bg-brand-100 ${outer}`}
    >
      {showImage ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes="80px"
          className="object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span
          className={`flex h-full w-full items-center justify-center font-semibold text-brand-700 ${text}`}
        >
          {initials}
        </span>
      )}
    </div>
  );
}
