import { useLocale, useTranslations } from 'next-intl';
import Container from './Container';

export default function Footer() {
  const t = useTranslations('footer');
  const tMeta = useTranslations('meta');
  const locale = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-brand-100 bg-brand-50/40">
      <Container className="py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <div className="text-base font-semibold text-brand-900">
              {tMeta('siteName')}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-brand-700">
              {t('disclaimer')}
            </p>
          </div>
          <ul className="flex gap-6 text-sm text-brand-700">
            <li><a href={`/${locale}/therapists`} className="hover:text-brand-900">{t('contact')}</a></li>
            <li><a href={`/${locale}`} className="hover:text-brand-900">{t('privacy')}</a></li>
            <li><a href={`/${locale}`} className="hover:text-brand-900">{t('terms')}</a></li>
          </ul>
        </div>
        <div className="mt-8 border-t border-brand-100 pt-6 text-xs text-brand-500">
          © {year} {tMeta('siteName')}. {t('rights')}
        </div>
      </Container>
    </footer>
  );
}
