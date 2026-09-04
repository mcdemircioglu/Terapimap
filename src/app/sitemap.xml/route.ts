import { CITIES, getCitySlug } from "@/lib/cities";
import { PROF_TYPE_SLUG_MAP } from "@/lib/seo-slugs";
import { MIN_THERAPISTS_FOR_INDEX } from "@/lib/seo-landing";
import { getTherapists, getSpecialties } from "@/lib/queries";
import { getArticlesForSitemap } from "@/lib/articles";
import { ARTICLE_CATEGORIES } from "@/types/database";
import { getProfessionalUrlSegment } from "@/lib/utils";

// EN locale noindex olduğu için sitemap yalnızca TR URL'leri içerir.
const locales = ["tr"] as const;

export const revalidate = 3600;

const BASE = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://terapimap.com"
).replace(/\/$/, "");

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function url(path: string) {
  return `${BASE}${path}`;
}

type SitemapItem = {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
};

function item(
  path: string,
  changefreq: string,
  priority: number,
  lastmod = new Date()
): SitemapItem {
  return {
    loc: url(path),
    lastmod: lastmod.toISOString(),
    changefreq,
    priority,
  };
}

export async function GET() {
  const [therapists, specialties, articles] = await Promise.all([
    getTherapists(),
    getSpecialties(),
    getArticlesForSitemap(),
  ]);

  // Onaylı terapist sayıları: yalnızca isIndexable ile AYNI eşiği (P1/P2
  // düzeltmesi — MIN_THERAPISTS_FOR_INDEX, tek kaynak seo-landing.ts'te)
  // geçen sayfalar sitemap'e girer. Eşik burada farklı olursa sitemap'te
  // noindex sayfalar listelenir (Search Console: "gönderilen URL noindex").
  const cityCounts = new Map<string, number>();
  const specialtyCounts = new Map<string, number>();
  const comboCounts = new Map<string, number>();
  const cityProfTypeCounts = new Map<string, number>();

  for (const t of therapists) {
    const citySlug = t.city ? getCitySlug(t.city) : null;
    if (citySlug) {
      cityCounts.set(citySlug, (cityCounts.get(citySlug) ?? 0) + 1);
      if (t.professional_type) {
        const ptKey = `${citySlug}:${t.professional_type}`;
        cityProfTypeCounts.set(ptKey, (cityProfTypeCounts.get(ptKey) ?? 0) + 1);
      }
    }
    for (const s of t.specialties) {
      specialtyCounts.set(s.slug, (specialtyCounts.get(s.slug) ?? 0) + 1);
      if (citySlug) {
        const key = `${citySlug}:${s.slug}`;
        comboCounts.set(key, (comboCounts.get(key) ?? 0) + 1);
      }
    }
  }

  const items: SitemapItem[] = [];

  for (const locale of locales) {
    const l = `/${locale}`;

    items.push(item(l, "daily", 1.0));
    // TR → /terapistler/, EN → /therapists/
    const listSlug = locale === "tr" ? "terapistler" : "therapists";
    items.push(item(`${l}/${listSlug}`, "daily", 0.9));
    items.push(item(`${l}/one-cikan-terapistler`, "weekly", 0.7));

    for (const city of CITIES) {
      if ((cityCounts.get(city.slug) ?? 0) < MIN_THERAPISTS_FOR_INDEX) continue;
      items.push(item(`${l}/${listSlug}/${city.slug}`, "weekly", 0.8));

      for (const specialty of specialties) {
        if ((comboCounts.get(`${city.slug}:${specialty.slug}`) ?? 0) < MIN_THERAPISTS_FOR_INDEX) continue;
        items.push(
          item(`${l}/${listSlug}/${city.slug}/${specialty.slug}`, "weekly", 0.6)
        );
      }
    }

    items.push(item(`${l}/online-terapi`, "weekly", 0.8));
    for (const city of CITIES) {
      for (const [ptSlug, profType] of Object.entries(PROF_TYPE_SLUG_MAP)) {
        const ptKey = `${city.slug}:${profType}`;
        if ((cityProfTypeCounts.get(ptKey) ?? 0) < MIN_THERAPISTS_FOR_INDEX) continue;
        items.push(item(`${l}/${city.slug}-${ptSlug}`, "weekly", 0.8));
      }
    }

    for (const specialty of specialties) {
      if ((specialtyCounts.get(specialty.slug) ?? 0) < MIN_THERAPISTS_FOR_INDEX) continue;
      items.push(item(`${l}/${specialty.slug}`, "weekly", 0.7));
    }
  }

  // Bireysel terapist profilleri — asıl "ürün" sayfaları. lastmod = updated_at
  // (terapist profilini güncelleyince/doğrulayınca Google yeniden tarar).
  for (const therapist of therapists) {
    if (!therapist.slug) continue;
    const lastmod = therapist.updated_at
      ? new Date(therapist.updated_at)
      : new Date();

    for (const locale of locales) {
      const typeSegment = getProfessionalUrlSegment(therapist.professional_type);
      items.push(
        item(`/${locale}/${typeSegment}/${therapist.slug}`, "monthly", 0.8, lastmod)
      );
    }
  }

  // Psikoloji Rehberi — yalnızca yayınlanmış içerikler (draft asla girmez)
  for (const locale of locales) {
    items.push(item(`/${locale}/psikoloji-rehberi`, "weekly", 0.8));
    for (const category of ARTICLE_CATEGORIES) {
      items.push(item(`/${locale}/psikoloji-rehberi/kategori/${category}`, "weekly", 0.6));
    }
  }
  for (const article of articles) {
    const lastmod = article.updated_at ? new Date(article.updated_at) : new Date();
    for (const locale of locales) {
      items.push(
        item(`/${locale}/psikoloji-rehberi/${article.slug}`, "monthly", 0.7, lastmod)
      );
    }
  }

  const uniqueItems = Array.from(
    new Map(items.map((i) => [i.loc, i])).values()
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueItems
  .map(
    (i) => `  <url>
    <loc>${escapeXml(i.loc)}</loc>
    <lastmod>${i.lastmod}</lastmod>
    <changefreq>${i.changefreq}</changefreq>
    <priority>${i.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
