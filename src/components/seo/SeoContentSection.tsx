import Link from 'next/link';
import type { LandingCopy, InternalLink } from '@/lib/seo-landing';

/**
 * Kart listesinin altında yer alan SEO içerik bloğu:
 * açıklama bölümleri (H2), SSS ve dahili linkler.
 * Server component — statik HTML üretir.
 */
export default function SeoContentSection({
  copy,
  internalLinks,
  faqHeading = 'Sık Sorulan Sorular',
  linksHeading = 'İlgili Aramalar',
}: {
  copy: LandingCopy;
  internalLinks: InternalLink[];
  faqHeading?: string;
  linksHeading?: string;
}) {
  return (
    <section className="mt-14 border-t border-brand-100 pt-10">
      <div className="mx-auto max-w-3xl space-y-10">
        {/* İçerik bölümleri */}
        {copy.sections.map((sec, i) => (
          <div key={i}>
            <h2 className="text-xl font-semibold tracking-tight text-brand-900">
              {sec.heading}
            </h2>
            <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-brand-700">
              {sec.paragraphs.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </div>
          </div>
        ))}

        {/* SSS */}
        {copy.faqs.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-brand-900">
              {faqHeading}
            </h2>
            <div className="mt-4 space-y-3">
              {copy.faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-brand-100 bg-white p-4"
                >
                  <summary className="cursor-pointer list-none text-sm font-semibold text-brand-900 marker:hidden">
                    <span className="flex items-center justify-between gap-3">
                      {faq.q}
                      <span
                        aria-hidden="true"
                        className="text-brand-400 transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-brand-700">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Dahili linkler */}
        {internalLinks.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-brand-900">
              {linksHeading}
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {internalLinks.map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="inline-block rounded-full border border-brand-200 bg-brand-50/60 px-3.5 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-900"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
