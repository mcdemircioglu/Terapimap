import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales } from './i18n';

export default createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});

export const config = {
  // Skip API routes, _next, static files, favicon.
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
