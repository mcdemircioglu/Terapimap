'use client';

import { usePathname, useRouter } from 'next/navigation';
import { locales, type Locale } from '@/i18n';
import { cn } from '@/lib/utils';

export default function LocaleSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: Locale) {
    if (!pathname) return;
    // Replace the leading /xx segment with the target locale.
    const segments = pathname.split('/');
    if (segments.length > 1 && (locales as readonly string[]).includes(segments[1])) {
      segments[1] = next;
      router.push(segments.join('/') || `/${next}`);
    } else {
      router.push(`/${next}`);
    }
  }

  return (
    <div className="inline-flex items-center rounded-full border border-brand-200 bg-white p-0.5 text-xs">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => switchTo(l)}
          className={cn(
            'rounded-full px-2.5 py-1 font-medium uppercase transition-colors',
            l === current
              ? 'bg-brand-600 text-white'
              : 'text-brand-700 hover:bg-brand-50',
          )}
          aria-pressed={l === current}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
