/**
 * Rehber makalesi OG görseli — dinamik.
 * Kapak görseli varsa: kapak + marka rozeti overlay.
 * Yoksa: açık zeminli, logo + başlık + kategori düzeni.
 */
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Terapimap Psikoloji Rehberi';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const fontSemi = fetch(
  new URL('../../../../assets/fonts/inter-latin-ext-600-normal.woff', import.meta.url),
).then((r) => r.arrayBuffer());
const fontSemiLatin = fetch(
  new URL('../../../../assets/fonts/inter-latin-600-normal.woff', import.meta.url),
).then((r) => r.arrayBuffer());
const fontReg = fetch(
  new URL('../../../../assets/fonts/inter-latin-ext-400-normal.woff', import.meta.url),
).then((r) => r.arrayBuffer());

const CATEGORY_LABELS: Record<string, string> = {
  'terapi-rehberi': 'Terapi Rehberi',
  'psikolojik-konular': 'Psikolojik Konular',
  'terapi-yontemleri': 'Terapi Yöntemleri',
  'cocuk-ve-ergen': 'Çocuk ve Ergen',
  'iliskiler': 'İlişkiler',
  'genel-psikoloji': 'Genel Psikoloji',
};

function Pin({ size: s, pin, heart }: { size: number; pin: string; heart: string }) {
  return (
    <svg width={s} height={s} viewBox="0 0 64 64">
      <path
        fill={pin}
        d="M32 4C19 4 8.5 14.5 8.5 27.5 8.5 44 24 53 30.2 61.2c.9 1.2 2.7 1.2 3.6 0C40 53 55.5 44 55.5 27.5 55.5 14.5 45 4 32 4z"
      />
      <path
        fill={heart}
        d="M32 38.5c-.5 0-1-.2-1.4-.5-4.7-3.9-9.1-7-9.1-12 0-3.4 2.7-6 6-6 2 0 3.6 1 4.5 2.5.9-1.5 2.5-2.5 4.5-2.5 3.3 0 6 2.6 6 6 0 5-4.4 8.1-9.1 12-.4.3-.9.5-1.4.5z"
      />
    </svg>
  );
}

export default async function OgImage({ params }: { params: { slug: string } }) {
  let title = 'Psikoloji Rehberi';
  let category = '';
  let cover: string | null = null;

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const res = await fetch(
        `${url}/rest/v1/articles?slug=eq.${encodeURIComponent(params.slug)}&select=title,category,cover_image_url&limit=1`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 86400 } },
      );
      const rows = (await res.json()) as {
        title: string; category: string; cover_image_url: string | null;
      }[];
      if (rows?.[0]) {
        title = rows[0].title;
        category = CATEGORY_LABELS[rows[0].category] ?? '';
        cover = rows[0].cover_image_url;
      }
    }
  } catch {
    // jenerik marka görseline düşülür
  }

  const [semi, semiLatin, reg] = await Promise.all([fontSemi, fontSemiLatin, fontReg]);
  const fonts = [
    { name: 'Inter', data: semiLatin, weight: 600 as const },
    { name: 'Inter', data: semi, weight: 600 as const },
    { name: 'Inter', data: reg, weight: 400 as const },
  ];

  if (cover) {
    return new ImageResponse(
      (
        <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', fontFamily: 'Inter' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="" width={1200} height={630} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
          <div
            style={{
              position: 'absolute', left: 0, right: 0, bottom: 0, display: 'flex',
              alignItems: 'center', gap: 16, padding: '20px 40px', backgroundColor: '#102224',
            }}
          >
            <Pin size={40} pin="#5ba1a3" heart="#102224" />
            <div style={{ fontSize: 28, fontWeight: 600, color: '#daecec' }}>Terapimap</div>
            <div style={{ fontSize: 24, color: '#88bfbf', marginLeft: 'auto' }}>Psikoloji Rehberi</div>
          </div>
        </div>
      ),
      { ...size, fonts },
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', backgroundColor: '#f0f7f7',
          padding: '64px 72px', fontFamily: 'Inter',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Pin size={52} pin="#316c6f" heart="#f0f7f7" />
            <div style={{ fontSize: 34, fontWeight: 600, color: '#1f3a3d' }}>Terapimap</div>
          </div>
          {category ? (
            <div
              style={{
                display: 'flex', fontSize: 24, fontWeight: 600, color: '#2a565a',
                backgroundColor: '#daecec', padding: '10px 24px', borderRadius: 999,
              }}
            >
              {category}
            </div>
          ) : null}
        </div>

        <div
          style={{
            fontSize: title.length > 60 ? 48 : 58, fontWeight: 600,
            color: '#1f3a3d', lineHeight: 1.2, maxWidth: 1000,
          }}
        >
          {title}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 26, color: '#3f8688' }}>Psikoloji Rehberi</div>
          <div style={{ display: 'flex', height: 8, width: 280, backgroundColor: '#5ba1a3', borderRadius: 4 }} />
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
