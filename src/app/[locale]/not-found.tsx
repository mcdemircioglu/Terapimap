import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import Container from '@/components/Container';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  const t = useTranslations('errors');
  const locale = useLocale();
  return (
    <Container className="py-24 text-center">
      <h1 className="text-3xl font-semibold text-brand-900">{t('notFound')}</h1>
      <p className="mt-3 text-brand-700">{t('notFoundBody')}</p>
      <div className="mt-8">
        <Link href={`/${locale}`}>
          <Button>{t('backHome')}</Button>
        </Link>
      </div>
    </Container>
  );
}
