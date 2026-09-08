import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { defaultLocale, locales } from './i18n';

const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});

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
  return intlMiddleware(request);
}

export const config = {
  // Skip API routes, admin panel, _next, static files, favicon.
  matcher: ['/((?!api|admin|profil-dogrula|_next|.*[.].*).*)'],
};
