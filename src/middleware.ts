import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { defaultLocale, locales } from './i18n';

const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});

// ─────────────────────────────────────────────────────────────────────────────
// Statik (ISR) liste sayfaları + dinamik varyant
//
// Liste/landing sayfaları (page.tsx) searchParams OKUMAZ → ISR ile önbelleğe
// alınır. Filtre/sayfalama query'si taşıyan istekler (?page=2, ?online=1 …)
// aynı URL'de kalır ama burada içeride /{locale}/dyn/... rotasına rewrite
// edilir; o rota force-dynamic'tir ve aynı view'i searchParams ile render eder.
// utm_*, gclid, fbclid gibi takip parametreleri listede yok → statik sayfa
// servis edilmeye devam eder.
// ─────────────────────────────────────────────────────────────────────────────
const DYN_QUERY_KEYS = ['page', 'online', 'inPerson', 'type', 'district', 'q', 'specialty', 'city'];

// app/[locale] altındaki literal (tek segmentli) rotalar — bunlar [seoSlug]
// değildir, dinamik varyanta rewrite edilmemeli. Yeni bir tek segmentli sayfa
// eklenir ve ?page= okuyorsa buraya EKLEME; [seoSlug] dışındaysa zaten kendi
// rotası çözülür. Liste yalnızca "?page=" taşıyan istekler için önemli.
const RESERVED_TOP_SEGMENTS = new Set([
  'about', 'aile-terapisti', 'cerez-politikasi', 'cocuk-psikiyatristi', 'dyn',
  'gizlilik-politikasi', 'iletisim', 'kullanim-kosullari', 'kvkk-aydinlatma-metni',
  'one-cikan-terapistler', 'psikiyatrist', 'psikolog', 'psikoloji-rehberi',
  'psikolojik-danisman', 'terapist-profil-politikasi', 'terapistler', 'testler',
  'therapist', 'therapists', 'uzman-basvuru', 'panel',
]);

function rewriteToDynamic(request: NextRequest): NextResponse | null {
  const { pathname, searchParams } = request.nextUrl;
  if (!DYN_QUERY_KEYS.some((k) => searchParams.has(k))) return null;

  const seg = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  const [locale, first, ...rest] = seg;
  if (!locale || !(locales as readonly string[]).includes(locale) || !first) return null;

  let target: string | null = null;
  if (first === 'terapistler' || first === 'therapists') {
    // /terapistler, /terapistler/{sehir}, /terapistler/{sehir}/{uzmanlik}
    if (rest.length <= 2) {
      target = `/${locale}/dyn/therapists${rest.length ? '/' + rest.join('/') : ''}`;
    }
  } else if (rest.length === 0 && searchParams.has('page') && !RESERVED_TOP_SEGMENTS.has(first)) {
    // /{seoSlug}?page=N
    target = `/${locale}/dyn/s/${first}`;
  }
  if (!target) return null;

  const url = request.nextUrl.clone();
  url.pathname = target;
  return NextResponse.rewrite(url);
}

/**
 * /panel altındaki route'lar locale routing'in tamamen dışında.
 * Tek iş: Supabase auth session cookie'sini tazelemek. App Router'da
 * Server Component'ler cookie yazamadığı için (bkz. src/lib/supabase/server.ts
 * içindeki try/catch) bu adım burada, middleware'de yapılmalı — resmi
 * @supabase/ssr + Next.js App Router deseni budur.
 *
 * Diğer tüm path'ler için davranış değişmez: next-intl middleware'i
 * aynen çalışmaya devam eder.
 */
async function refreshPanelSession(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    },
  );

  // Erişim token'ı süresi dolmuşsa burada tazelenir ve response'a yazılır.
  await supabase.auth.getUser();

  return response;
}

export default async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/panel')) {
    return refreshPanelSession(request);
  }
  // /{locale}/dyn/... yalnızca içeride rewrite hedefi; dışarıdan erişilemez.
  if (/^\/[^/]+\/dyn(\/|$)/.test(request.nextUrl.pathname)) {
    return new NextResponse('Not found', { status: 404 });
  }
  const dynamicRewrite = rewriteToDynamic(request);
  if (dynamicRewrite) return dynamicRewrite;
  return intlMiddleware(request);
}

export const config = {
  // Skip API routes, admin panel, _next, static files, favicon.
  matcher: ['/((?!api|admin|profil-dogrula|_next|.*[.].*).*)'],
};
