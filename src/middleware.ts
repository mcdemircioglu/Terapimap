import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { defaultLocale, locales } from './i18n';

const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});

// SEO T1: profesyon segmenti terapistin gerçek professional_type'ıyla
// eşleşmiyorsa (ör. bir psikiyatrist /psikolog/slug üzerinden açıldıysa)
// kalıcı yönlendirme yap. Sembolik linkle paylaşılan [slug]/page.tsx
// component'i hangi literal segmentten çağrıldığını bilemediği için bu
// kontrol burada, gerçek istek path'ini gören tek katmanda yapılıyor.
const PROFILE_SEGMENT_RE = /^\/(tr)\/(psikolog|psikiyatrist|cocuk-psikiyatristi|aile-terapisti|psikolojik-danisman)\/([^/]+)\/?$/;

const PROF_TYPE_URL: Record<string, string> = {
  psychologist: 'psikolog',
  clinical_psychologist: 'psikolog',
  psychiatrist: 'psikiyatrist',
  child_psychiatrist: 'cocuk-psikiyatristi',
  family_therapist: 'aile-terapisti',
  counselor: 'psikolojik-danisman',
};

async function checkProfileSegment(request: NextRequest): Promise<NextResponse | null> {
  const match = PROFILE_SEGMENT_RE.exec(request.nextUrl.pathname);
  if (!match) return null;
  const [, locale, segment, slug] = match;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data } = await supabase
    .from('professionals')
    .select('professional_type')
    .eq('slug', slug)
    .maybeSingle();
  if (!data) return null; // bilinmeyen slug — normal 404 akışına bırak

  const correctSegment = PROF_TYPE_URL[data.professional_type ?? ''] ?? 'psikolog';
  if (correctSegment === segment) return null;

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}/${correctSegment}/${slug}`;
  return NextResponse.redirect(url, 308);
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
  const segmentRedirect = await checkProfileSegment(request);
  if (segmentRedirect) return segmentRedirect;
  return intlMiddleware(request);
}

export const config = {
  // Skip API routes, admin panel, _next, static files, favicon.
  matcher: ['/((?!api|admin|profil-dogrula|_next|.*[.].*).*)'],
};
