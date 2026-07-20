import type { Metadata } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';
import { LegalDoc, H2, P, UL, OL, Strong } from '@/components/LegalDoc';
import { absUrl } from '@/lib/schema';

const TITLE = 'Terapist Profil Politikası';
const UPDATED = '6 Temmuz 2026';

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Metadata {
  return {
    title: `${TITLE} | Terapimap`,
    description:
      'Terapimap uzman profillerinin oluşturulması, doğrulanması, güncellenmesi ve kaldırılması süreçleri.',
    alternates: { canonical: absUrl(`/${locale}/terapist-profil-politikasi`) },
    robots: { index: locale === 'tr', follow: true },
  };
}

export default function TerapistProfilPolitikasiPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);

  return (
    <LegalDoc title={TITLE} updatedAt={UPDATED}>
      <H2>1. Amaç</H2>
      <P>
        İşbu Terapist Profil Politikası; <Strong>Terapimap</Strong> (&quot;
        <Strong>Platform</Strong>&quot;) üzerinde yer alan psikolog,
        psikolojik danışman, aile danışmanı, klinik psikolog ve psikiyatrist
        profillerinin hangi kaynaklardan oluşturulduğunu, hangi bilgileri
        içerdiğini ve profil sahiplerinin doğrulama, güncelleme ve kaldırma
        haklarını nasıl kullanabileceğini açıklar.
      </P>

      <H2>2. Profillerde Yayınlanan Bilgiler</H2>
      <UL>
        <li>Ad soyad ve unvan,</li>
        <li>Uzmanlık alanları,</li>
        <li>Eğitim bilgileri ve mesleki deneyim,</li>
        <li>Şehir ve adres,</li>
        <li>Telefon ve e-posta,</li>
        <li>Web sitesi ve sosyal medya hesapları,</li>
        <li>Profil fotoğrafı,</li>
        <li>Hakkında (tanıtım) bilgisi.</li>
      </UL>

      <H2>3. Bilgilerin Kaynağı</H2>
      <P>Profil bilgileri aşağıdaki kaynaklardan elde edilebilmektedir:</P>
      <UL>
        <li>Uzmanın kendisi tarafından iletilen bilgiler,</li>
        <li>Uzmanın kendi web sitesi,</li>
        <li>Uzmanın kamuya açık sosyal medya hesapları,</li>
        <li>Kamuya açık web siteleri ve mesleki rehberler.</li>
      </UL>
      <P>
        Kamuya açık kaynaklardan derlenen bilgilerin işlenmesi, 6698 sayılı
        KVKK&apos;nın 5/2-d maddesi (ilgili kişinin kendisi tarafından
        alenileştirilmiş olması) ile 5/2-f maddesi (meşru menfaat) hukuki
        sebeplerine dayanmaktadır. Alenileştirme amacı dışında kullanım
        yapılmamasına özen gösterilir; profiller yalnızca uzmanın mesleki
        tanıtımına hizmet edecek şekilde yayınlanır.
      </P>

      <H2>4. Profil Doğrulama</H2>
      <P>
        Uzmanlar, kendilerine ait profili sahiplenerek doğrulayabilir.
        Doğrulama süreci şu şekilde işler:
      </P>
      <OL>
        <li>
          Profil sayfanızdaki doğrulama bağlantısını kullanarak veya{' '}
          <Strong>iletisim@terapimap.com</Strong> adresine yazarak doğrulama
          talebi oluşturursunuz.
        </li>
        <li>
          Kimliğinizin ve mesleki unvanınızın teyidi için makul belgeler
          (ör. diploma, mesleki kimlik veya kurumsal e-posta üzerinden teyit)
          talep edilebilir.
        </li>
        <li>
          Talep, Platform yönetimi tarafından incelenir ve en geç 7 iş günü
          içinde sonuçlandırılır.
        </li>
        <li>
          Doğrulanan profiller üzerinde bilgi güncelleme talepleri doğrudan
          profil sahibi tarafından iletilebilir.
        </li>
      </OL>

      <H2>5. Profil Güncelleme</H2>
      <P>
        Uzmanlar; profillerindeki eksik veya hatalı bilgilerin düzeltilmesini
        ve güncellenmesini her zaman talep edebilir. Güncelleme talepleri{' '}
        <Strong>iletisim@terapimap.com</Strong> adresine iletilir ve en geç 7
        iş günü içinde işleme alınır. KVKK&apos;nın 11. maddesi kapsamındaki
        düzeltme talepleri ise en geç 30 gün içinde sonuçlandırılır.
      </P>

      <H2>6. Profil Kaldırma</H2>
      <OL>
        <li>
          Profilinin Platformdan tamamen kaldırılmasını isteyen uzman,{' '}
          <Strong>iletisim@terapimap.com</Strong> adresine ad soyad ve profil
          bağlantısını içeren bir talep iletir.
        </li>
        <li>
          Talebin profil sahibinden geldiğinin teyidi amacıyla basit bir
          kimlik doğrulaması yapılabilir (ör. profilde kayıtlı e-posta
          üzerinden teyit).
        </li>
        <li>
          Teyit edilen kaldırma talepleri en geç <Strong>7 iş günü</Strong>{' '}
          içinde yerine getirilir; profil yayından kaldırılır ve profil
          verileri, hukuki saklama yükümlülükleri saklı kalmak üzere silinir.
        </li>
        <li>
          Kaldırılan profillerin arama motoru önbelleklerinden düşmesi ilgili
          arama motorlarının güncelleme sürelerine bağlıdır; talep hâlinde
          Terapimap kaldırma bildirimleri konusunda makul destek sağlar.
        </li>
      </OL>

      <H2>7. İtiraz ve Şikâyet</H2>
      <P>
        Profilindeki bilgilerin hatalı olduğunu, kendisine ait olmadığını
        veya hukuka aykırı şekilde yayınlandığını düşünen herkes{' '}
        <Strong>iletisim@terapimap.com</Strong> adresine bildirimde
        bulunabilir. Bildirimler ivedilikle incelenir; gerekli hâllerde ilgili
        profil, inceleme süresince geçici olarak yayından kaldırılabilir.
        KVKK kapsamındaki haklarınız için ayrıca{' '}
        <a
          href={`/${locale}/kvkk-aydinlatma-metni`}
          className="underline hover:text-brand-900"
        >
          KVKK Aydınlatma Metni
        </a>
        &apos;ni inceleyebilirsiniz.
      </P>

      <H2>8. Sorumluluk Reddi</H2>
      <P>
        Terapimap bir aracı dizin platformudur; profillerde yer alan
        bilgilerin doğruluğu ve güncelliği konusunda makul çaba gösterir,
        ancak uzmanların yetkinliğine, unvanlarının geçerliliğine veya
        sundukları hizmetlere ilişkin garanti vermez. Uzman ile danışan
        arasındaki ilişkiden Terapimap sorumlu değildir.
      </P>
    </LegalDoc>
  );
}
