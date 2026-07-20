/**
 * Terapist profili OG görseli — logo temalı, dinamik.
 * Terapist fotoğrafı bilinçli olarak KULLANILMAZ; marka kimliği öne çıkar.
 * Edge runtime + Supabase REST (anon key, RLS public read).
 */
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Terapimap terapist profili';
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
  let name = 'Terapist Profili';
  let subtitle = '';
  let area = '';

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const res = await fetch(
        `${url}/rest/v1/professionals?slug=eq.${encodeURIComponent(params.slug)}&select=name,title,city,district&limit=1`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 86400 } },
      );
      const rows = (await res.json()) as {
        name: string; title: string | null; city: string; district: string | null;
      }[];
      if (rows?.[0]) {
        name = rows[0].name;
        subtitle = rows[0].title ?? '';
        area = [rows[0].district, rows[0].city].filter(Boolean).join(', ');
      }
    }
  } catch {
    // veri alınamazsa marka temalı jenerik görsel üretilir
  }

  const [semi, semiLatin, reg] = await Promise.all([fontSemi, fontSemiLatin, fontReg]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#102224',
          padding: '64px 72px',
          fontFamily: 'Inter',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Pin size={52} pin="#5ba1a3" heart="#102224" />
          <div style={{ fontSize: 34, fontWeight: 600, color: '#daecec' }}>Terapimap</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              fontSize: name.length > 28 ? 56 : 68,
              fontWeight: 600,
              color: '#f0f7f7',
              lineHeight: 1.15,
            }}
          >
            {name}
          </div>
          {subtitle ? (
            <div style={{ fontSize: 32, color: '#88bfbf' }}>{subtitle}</div>
          ) : null}
          {area ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Pin size={26} pin="#6da571" heart="#102224" />
              <div style={{ fontSize: 28, color: '#b6d9d9' }}>{area}</div>
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', height: 8, backgroundColor: '#5ba1a3', borderRadius: 4 }} />
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Inter', data: semiLatin, weight: 600 },
        { name: 'Inter', data: semi, weight: 600 },
        { name: 'Inter', data: reg, weight: 400 },
      ],
    },
  );
}
