import type { Metadata } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';
import Container from '@/components/Container';
import { absUrl } from '@/lib/schema';

const TITLE = 'İletişim';

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Metadata {
  return {
    title: `${TITLE} | Terapimap`,
    description:
      'Terapimap ile iletişime geçin: sorularınız, profil doğrulama, güncelleme ve kaldırma talepleriniz için.',
    alternates: { canonical: absUrl(`/${locale}/iletisim`) },
    robots: { index: true, follow: true },
  };
}

export default function IletisimPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);

  return (
    <section>
      <Container className="py-12 md:py-16">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-brand-900 md:text-4xl">
            {TITLE}
          </h1>
          <div className="mt-6 space-y-5 text-base leading-relaxed text-brand-700">
            <p>
              Sorularınız, önerileriniz, profil doğrulama, güncelleme veya
              kaldırma talepleriniz ile kişisel verilerinize ilişkin
              başvurularınız için bize e-posta ile ulaşabilirsiniz.
            </p>
            <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-6">
              <div className="text-sm font-medium text-brand-500">E-posta</div>
              <a
                href="mailto:iletisim@terapimap.com"
                className="mt-1 block text-lg font-semibold text-brand-900 hover:underline"
              >
                iletisim@terapimap.com
              </a>
            </div>
            <p>
              KVKK kapsamındaki başvurularınız, en geç 30 gün içinde; profil
              doğrulama, güncelleme ve kaldırma talepleriniz ise en geç 7 iş
              günü içinde yanıtlanır.
            </p>
            <p className="text-sm text-brand-500">
              Terapimap bir sağlık hizmeti sağlayıcısı değildir. Acil bir
              durumdaysanız 112 Acil Çağrı Merkezi&apos;ni arayınız.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
