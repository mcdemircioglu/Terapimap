import type { Metadata } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';
import { LegalDoc, H2, P, UL, Strong } from '@/components/LegalDoc';
import { absUrl } from '@/lib/schema';

const TITLE = 'Çerez Politikası';
const UPDATED = '6 Temmuz 2026';

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Metadata {
  return {
    title: `${TITLE} | Terapimap`,
    description:
      'Terapimap çerez politikası: platformda kullanılan çerezler ve yönetim seçenekleri.',
    alternates: { canonical: absUrl(`/${locale}/cerez-politikasi`) },
    robots: { index: locale === 'tr', follow: true },
  };
}

export default function CerezPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);

  return (
    <LegalDoc title={TITLE} updatedAt={UPDATED}>
      <H2>1. Genel</H2>
      <P>
        İşbu Çerez Politikası, <Strong>Terapimap</Strong> (&quot;
        <Strong>Platform</Strong>&quot;) tarafından terapimap.com adresinde
        kullanılan çerezler (cookies) ve benzeri teknolojiler hakkında, 6698
        sayılı Kişisel Verilerin Korunması Kanunu ile Kişisel Verileri Koruma
        Kurumu&apos;nun Çerez Uygulamaları Hakkında Rehberi doğrultusunda
        bilgilendirme yapmak amacıyla hazırlanmıştır.
      </P>

      <H2>2. Çerez Nedir?</H2>
      <P>
        Çerezler, ziyaret ettiğiniz web siteleri tarafından tarayıcınız
        aracılığıyla cihazınıza yerleştirilen küçük metin dosyalarıdır.
        Çerezler; sitenin çalışması, tercihlerinizin hatırlanması ve site
        kullanımının analiz edilmesi gibi amaçlarla kullanılır.
      </P>

      <H2>3. Kullanılan Çerez Türleri</H2>
      <UL>
        <li>
          <Strong>Zorunlu (teknik) çerezler:</Strong> Platformun temel
          işlevlerinin çalışması için gereklidir. Dil/bölge tercihinizin
          hatırlanması ve oturum yönetimi bu kapsamdadır. Bu çerezler için
          KVKK uyarınca açık rıza gerekmez.
        </li>
        <li>
          <Strong>Güvenlik ve performans çerezleri:</Strong> Platform,
          güvenlik ve performans hizmetleri için Cloudflare altyapısını
          kullanmaktadır. Cloudflare, bot koruması ve trafik güvenliği
          amacıyla teknik çerezler yerleştirebilir.
        </li>
        <li>
          <Strong>İşlevsel çerezler:</Strong> Tercihlerinizi (ör. seçtiğiniz
          dil) hatırlayarak deneyiminizi iyileştirir.
        </li>
      </UL>
      <P>
        Platformda hâlihazırda üçüncü taraf reklam veya pazarlama çerezi
        kullanılmamaktadır. İleride analitik veya benzeri rızaya tabi çerezler
        kullanılması hâlinde bu politika güncellenir ve gerekli hâllerde açık
        rızanız alınır.
      </P>

      <H2>4. Çerezlerin Kullanım Amaçları</H2>
      <UL>
        <li>Platformun güvenli ve doğru şekilde çalışmasını sağlamak,</li>
        <li>Dil ve bölge tercihlerini hatırlamak,</li>
        <li>Platform trafiğini kötüye kullanıma karşı korumak,</li>
        <li>Performansı ölçmek ve iyileştirmek.</li>
      </UL>

      <H2>5. Çerezleri Yönetme</H2>
      <P>
        Tarayıcınızın ayarlarından çerezleri silebilir, engelleyebilir veya
        çerez yerleştirilmeden önce uyarı verilmesini sağlayabilirsiniz.
        Zorunlu çerezlerin engellenmesi hâlinde Platformun bazı işlevleri
        gerektiği gibi çalışmayabilir. Yaygın tarayıcıların çerez yönetimi
        sayfaları: Chrome, Firefox, Safari ve Edge&apos;in
        &quot;Ayarlar/Gizlilik&quot; bölümlerinden erişilebilir.
      </P>

      <H2>6. İletişim</H2>
      <P>
        Çerez uygulamalarımıza ilişkin sorularınız için{' '}
        <Strong>iletisim@terapimap.com</Strong> adresine yazabilir, kişisel
        verilerinize ilişkin haklarınız için{' '}
        <a
          href={`/${locale}/kvkk-aydinlatma-metni`}
          className="underline hover:text-brand-900"
        >
          KVKK Aydınlatma Metni
        </a>
        &apos;ni inceleyebilirsiniz.
      </P>
    </LegalDoc>
  );
}
