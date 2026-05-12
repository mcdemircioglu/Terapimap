import { CITIES } from "@/lib/cities";
import { getKnownSeoSlugs } from "@/lib/seo-slugs";
import { getTherapists, getSpecialties } from "@/lib/queries";
import { locales } from "@/i18n";

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
  const [therapists, specialties] = await Promise.all([
    getTherapists(),
    getSpecialties(),
  ]);

  const items: SitemapItem[] = [];

  for (const locale of locales) {
    const l = `/${locale}`;

    items.push(item(l, "daily", 1.0));
    items.push(item(`${l}/therapists`, "daily", 0.9));

    for (const city of CITIES) {
      items.push(item(`${l}/therapists/${city.slug}`, "weekly", 0.8));

      for (const specialty of specialties) {
        items.push(
          item(`${l}/therapists/${city.slug}/${specialty.slug}`, "weekly", 0.6)
        );
      }
    }

    for (const seoSlug of getKnownSeoSlugs()) {
      items.push(item(`${l}/${seoSlug}`, "weekly", 0.8));
    }

    for (const specialty of specialties) {
      items.push(item(`${l}/${specialty.slug}`, "weekly", 0.7));
    }
  }

  for (const therapist of therapists) {
    const lastmod = therapist.updated_at
      ? new Date(therapist.updated_at)
      : new Date();

    for (const locale of locales) {
      items.push(
        item(`/${locale}/therapist/${therapist.slug}`, "monthly", 0.6, lastmod)
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
