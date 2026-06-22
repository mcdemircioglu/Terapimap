import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales } from './i18n';

export default createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});

export const config = {
  // Skip API routes, admin panel, _next, static files, favicon.
  matcher: ['/((?!api|admin|profil-dogrula|_next|.*[.].*).*)'],
};
