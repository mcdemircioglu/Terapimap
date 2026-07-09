import Link from 'next/link';
import type { InternalLink } from '@/lib/seo-landing';

/**
 * Şehir + uzmanlık kombinasyonunda sonuç yoksa gösterilen öneri bloğu.
 * Sayfa 404 olmaz; yakın uzmanlıklar ve online seçenekler önerilir.
 */
export default function SeoEmptySuggestions({
  message,
  links,
}: {
  message: string;
  links: InternalLink[];
}) {
  return (
    <div className="mt-6 text-left">
      <p className="text-sm leading-relaxed text-brand-700">{message}</p>
      {links.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {links.map((link, i) => (
            <li key={i}>
              <Link
                href={link.href}
                className="inline-block rounded-full border border-brand-200 bg-white px-3.5 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:border-brand-400 hover:text-brand-900"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
