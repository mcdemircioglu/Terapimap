import Link from 'next/link';
import LocationMap from '@/components/therapist/LocationMap';
import ArticleCard from '@/components/guide/ArticleCard';
import type { LandingCopy, InternalLink } from '@/lib/seo-landing';
import type { ArticleListItem } from '@/types/database';

/**
 * SEO landing sayfalarının kart listesi altındaki tam içerik bloğu.
 * Sabit sıra: Harita → Özgün içerik → SSS → Rehber içerikleri →
 * Benzer şehirler → Benzer uzmanlıklar.
 * Server component — statik HTML üretir (harita bileşeni lazy client'tır).
 */
export default function SeoLandingSections({
  locale,
  copy,
  mapEmbedUrl,
  mapTitle,
  articles,
  cityLinks,
  specialtyLinks,
  faqHeading = 'Sık Sorulan Sorular',
  guideHeading = 'İlgili Rehber İçerikleri',
  cityLinksHeading = 'Diğer Şehirlerdeki Terapistler',
  specialtyLinksHeading = 'İlgili Uzmanlık Alanları',
}: {
  locale: string;
  copy: LandingCopy;
  mapEmbedUrl: string | null;
  mapTitle: string;
  articles: ArticleListItem[];
  cityLinks: InternalLink[];
  specialtyLinks: InternalLink[];
  faqHeading?: string;
  guideHeading?: string;
  cityLinksHeading?: string;
  specialtyLinksHeading?: string;
}) {
  return (
    <section className="mt-14 border-t border-brand-100 pt-10">
      <div className="mx-auto max-w-3xl space-y-12">
        {/* 1) Harita */}
        {mapEmbedUrl && (
          <div>
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-brand-900">
              {mapTitle}
            </h2>
            <LocationMap embedUrl={mapEmbedUrl} title={mapTitle} showMapLabel="Haritayı Göster" />
          </div>
        )}

        {/* 2) Özgün SEO içeriği */}
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

        {/* 3) SSS */}
        {copy.faqs.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-brand-900">{faqHeading}</h2>
            <div className="mt-4 space-y-3">
              {copy.faqs.map((faq, i) => (
                <details key={i} className="group rounded-xl border border-brand-100 bg-white p-4">
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

        {/* 4) Rehber içerikleri */}
        {articles.length > 0 && (
          <div>
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-tight text-brand-900">
                {guideHeading}
              </h2>
              <Link
                href={`/${locale}/psikoloji-rehberi`}
                className="shrink-0 text-sm font-medium text-brand-600 hover:text-brand-800"
              >
                Tüm rehberler →
              </Link>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <ArticleCard key={a.id} article={a} locale={locale} />
              ))}
            </div>
          </div>
        )}

        {/* 5) Benzer şehirler */}
        {cityLinks.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-brand-900">
              {cityLinksHeading}
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {cityLinks.map((link, i) => (
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

        {/* 6) Benzer uzmanlıklar */}
        {specialtyLinks.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-brand-900">
              {specialtyLinksHeading}
            </h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {specialtyLinks.map((link, i) => (
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
