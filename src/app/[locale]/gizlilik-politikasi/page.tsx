import type { Metadata } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';
import { LegalDoc, H2, P, UL, Strong } from '@/components/LegalDoc';
import { absUrl } from '@/lib/schema';

const TITLE = 'Gizlilik Politikası';
const UPDATED = '6 Temmuz 2026';

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Metadata {
  return {
    title: `${TITLE} | Terapimap`,
    description:
      'Terapimap gizlilik politikası: kişisel verilerinizin nasıl toplandığı, kullanıldığı ve korunduğu hakkında bilgi.',
    alternates: { canonical: absUrl(`/${locale}/gizlilik-politikasi`) },
    robots: { index: true, follow: true },
  };
}

export default function GizlilikPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);

  return (
    <LegalDoc title={TITLE} updatedAt={UPDATED}>
      <H2>1. Genel</H2>
      <P>
        İşbu Gizlilik Politikası, <Strong>Terapimap</Strong> (&quot;
        <Strong>Platform</Strong>&quot;) tarafından terapimap.com adresinde
        sunulan hizmetler kapsamında kişisel verilerin nasıl toplandığını,
        kullanıldığını, paylaşıldığını ve korunduğunu açıklamaktadır. Bu
        politika, 6698 sayılı Kişisel Verilerin Korunması Kanunu
        (&quot;KVKK&quot;) ve ilgili ikincil mevzuata uygun olarak
        hazırlanmıştır ve{' '}
        <a
          href={`/${locale}/kvkk-aydinlatma-metni`}
          className="underline hover:text-brand-900"
        >
          KVKK Aydınlatma Metni
        </a>{' '}
        ile birlikte okunmalıdır.
      </P>

      <H2>2. Platformun Rolü</H2>
      <P>
        Terapimap, danışanlar ile ruh sağlığı uzmanlarını buluşturan bir
        çevrim içi dizin platformudur.{' '}
        <Strong>
          Terapimap terapi hizmeti veya herhangi bir sağlık hizmeti vermez;
        </Strong>{' '}
        yalnızca uzman profillerini yayınlayan ve iletişim taleplerini ilgili
        uzmana ileten bir aracıdır. Danışan ile uzman arasında kurulan hizmet
        ilişkisi ve bu ilişki kapsamında paylaşılan bilgiler tamamen
        tarafların kendi sorumluluğundadır.
      </P>

      <H2>3. Toplanan Bilgiler</H2>
      <UL>
        <li>
          <Strong>Danışanlardan:</Strong> İletişim formu aracılığıyla ad
          soyad, telefon, e-posta ve mesaj içeriği.
        </li>
        <li>
          <Strong>Uzmanlardan:</Strong> Profilde yayınlanmak üzere mesleki
          bilgiler (ad soyad, unvan, uzmanlık alanları, eğitim, deneyim,
          şehir, adres, iletişim bilgileri, web sitesi, sosyal medya
          hesapları, profil fotoğrafı, hakkında bilgisi).
        </li>
        <li>
          <Strong>Otomatik olarak:</Strong> IP adresi, cihaz ve tarayıcı
          bilgileri, kullanım kayıtları ve çerezler (bkz.{' '}
          <a
            href={`/${locale}/cerez-politikasi`}
            className="underline hover:text-brand-900"
          >
            Çerez Politikası
          </a>
          ).
        </li>
      </UL>

      <H2>4. Bilgilerin Kullanımı</H2>
      <UL>
        <li>İletişim taleplerinin seçilen uzmana iletilmesi,</li>
        <li>Uzman profillerinin yayınlanması ve yönetilmesi,</li>
        <li>Platformun çalışması, güvenliği ve iyileştirilmesi,</li>
        <li>Hukuki yükümlülüklerin yerine getirilmesi.</li>
      </UL>
      <P>
        Kişisel verileriniz, açık rızanız olmaksızın pazarlama amacıyla
        kullanılmaz ve üçüncü kişilere satılmaz.
      </P>

      <H2>5. Bilgilerin Paylaşımı</H2>
      <UL>
        <li>
          <Strong>
            Danışan verileri (ad soyad, telefon, e-posta, mesaj) yalnızca
            danışanın iletişim kurmak istediği ilgili uzmana iletilir.
          </Strong>{' '}
          Bu bilgilere başka hiçbir uzman veya üçüncü kişi erişemez.
        </li>
        <li>
          Uzman profil bilgileri, dizin hizmetinin doğası gereği Platform
          üzerinde kamuya açık şekilde yayınlanır.
        </li>
        <li>
          Barındırma ve teknik altyapı hizmetleri kapsamında veriler; Vercel
          (barındırma), Supabase (veri tabanı) ve Cloudflare (güvenlik ve
          performans) hizmet sağlayıcılarının sistemlerinde işlenebilir. Bu
          sağlayıcıların sunucuları yurt dışında bulunabilir.
        </li>
        <li>
          Yasal bir zorunluluk bulunması hâlinde yetkili kamu kurumlarıyla
          paylaşım yapılabilir.
        </li>
      </UL>

      <H2>6. Veri Güvenliği</H2>
      <P>
        Terapimap; kişisel verilerin hukuka aykırı işlenmesini, verilere
        hukuka aykırı erişilmesini önlemek ve verilerin muhafazasını sağlamak
        amacıyla uygun güvenlik düzeyini temin etmeye yönelik gerekli teknik
        ve idari tedbirleri alır. Bu kapsamda SSL/TLS şifreleme, erişim
        yetkilendirmesi ve güncel güvenlik altyapıları kullanılmaktadır.
        Bununla birlikte internet üzerinden yapılan hiçbir veri aktarımının
        %100 güvenli olduğu garanti edilemez.
      </P>

      <H2>7. Üçüncü Taraf Bağlantıları</H2>
      <P>
        Platform; uzmanların kendi web sitelerine ve sosyal medya hesaplarına
        bağlantılar içerebilir. Bu sitelerin gizlilik uygulamalarından
        Terapimap sorumlu değildir; ilgili sitelerin kendi gizlilik
        politikalarını incelemenizi öneririz.
      </P>

      <H2>8. Çocukların Gizliliği</H2>
      <P>
        Platform, 18 yaşın altındaki kişilere yönelik değildir. 18 yaşından
        küçük olduğunu bildiğimiz bir kişiden bilerek kişisel veri toplanmaz;
        böyle bir durumun tespiti hâlinde ilgili veriler silinir.
      </P>

      <H2>9. Haklarınız ve İletişim</H2>
      <P>
        KVKK kapsamındaki haklarınız ve başvuru yöntemi{' '}
        <a
          href={`/${locale}/kvkk-aydinlatma-metni`}
          className="underline hover:text-brand-900"
        >
          KVKK Aydınlatma Metni
        </a>
        &apos;nde açıklanmıştır. Gizlilikle ilgili her türlü soru ve talebiniz
        için <Strong>iletisim@terapimap.com</Strong> adresine yazabilirsiniz.
      </P>

      <H2>10. Değişiklikler</H2>
      <P>
        Bu Gizlilik Politikası zaman zaman güncellenebilir. Güncel sürüm bu
        sayfada yayımlanır ve yayım tarihinde yürürlüğe girer.
      </P>
    </LegalDoc>
  );
}
