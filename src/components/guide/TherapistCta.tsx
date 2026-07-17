/**
 * Terapist bulma CTA'sı — rehber sayfalarının sonunda.
 * Mevcut terapist listeleme sayfasına yönlendirir; filtre sistemine dokunmaz.
 */
import Link from 'next/link';

type Props = {
  locale: string;
};

export default function TherapistCta({ locale }: Props) {
  // /tr/therapists kalıcı olarak /tr/terapistler'e yönlenir — direkt hedefe linkle
  const therapistsHref = locale === 'tr' ? '/tr/terapistler' : `/${locale}/therapists`;
  return (
    <section className="rounded-2xl border border-brand-100 bg-brand-950 p-8 text-center md:p-10">
      <h2 className="text-xl font-semibold text-white md:text-2xl">
        Size uygun terapisti bulun
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-brand-200">
        Konum, uzmanlık alanı ve görüşme türüne göre terapistleri inceleyin.
      </p>
      <Link
        href={therapistsHref}
        className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-white px-8 text-base font-medium text-brand-900 shadow-soft transition-colors hover:bg-brand-50"
      >
        Terapistleri İncele
      </Link>
    </section>
  );
}
