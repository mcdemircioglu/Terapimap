import type { Metadata } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';
import { LegalDoc, H2, P, UL, Strong } from '@/components/LegalDoc';
import { absUrl } from '@/lib/schema';

const TITLE = 'Kullanım Koşulları';
const UPDATED = '6 Temmuz 2026';

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Metadata {
  return {
    title: `${TITLE} | Terapimap`,
    description:
      'Terapimap platformunun kullanım koşulları ve sorumluluk esasları.',
    alternates: { canonical: absUrl(`/${locale}/kullanim-kosullari`) },
    robots: { index: true, follow: true },
  };
}

export default function KullanimKosullariPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);

  return (
    <LegalDoc title={TITLE} updatedAt={UPDATED}>
      <H2>1. Taraflar ve Kapsam</H2>
      <P>
        İşbu Kullanım Koşulları (&quot;<Strong>Koşullar</Strong>&quot;),{' '}
        <Strong>Terapimap</Strong> (&quot;<Strong>Platform</Strong>&quot;)
        tarafından terapimap.com adresinde sunulan hizmetlerin kullanımına
        ilişkin şartları düzenler. Platformu ziyaret eden veya kullanan her
        kullanıcı, bu Koşulları okumuş ve kabul etmiş sayılır. Koşulları
        kabul etmiyorsanız lütfen Platformu kullanmayınız.
      </P>

      <H2>2. Hizmetin Niteliği — Aracı Platform</H2>
      <UL>
        <li>
          Terapimap; danışanlar ile psikolog, psikolojik danışman, aile
          danışmanı, klinik psikolog ve psikiyatristleri buluşturan bir{' '}
          <Strong>çevrim içi dizin (rehber) platformudur</Strong>.
        </li>
        <li>
          <Strong>
            Terapimap terapi hizmeti sunmaz ve herhangi bir sağlık hizmeti
            vermez.
          </Strong>{' '}
          Platform; teşhis, tedavi, danışmanlık veya tıbbi tavsiye
          sağlamaz.
        </li>
        <li>
          Platform yalnızca kullanıcıların uzman profillerini incelemesini ve
          iletişim formu aracılığıyla ilgili uzmana ulaşmasını sağlar.
        </li>
        <li>
          Danışan ile uzman arasında kurulacak her türlü hizmet ilişkisi,
          Platformdan bağımsız olarak tarafların kendi aralarında kurulur.
          Terapimap bu ilişkinin tarafı değildir.
        </li>
      </UL>

      <H2>3. Tıbbi Sorumluluk Reddi ve Acil Durum Uyarısı</H2>
      <P>
        Platformdaki hiçbir içerik tıbbi veya psikolojik tavsiye niteliği
        taşımaz ve profesyonel değerlendirmenin yerine geçmez.{' '}
        <Strong>
          Kendinize veya bir başkasına zarar verme riski içeren acil bir
          durumdaysanız 112 Acil Çağrı Merkezi&apos;ni arayınız
        </Strong>{' '}
        veya en yakın acil servise başvurunuz.
      </P>

      <H2>4. Kullanıcı Yükümlülükleri</H2>
      <UL>
        <li>Platformu hukuka ve dürüstlük kurallarına uygun kullanmak,</li>
        <li>
          İletişim formlarında doğru ve güncel bilgi vermek; üçüncü kişilere
          ait bilgileri izinsiz kullanmamak,
        </li>
        <li>
          Platformun işleyişini bozacak, güvenliğini tehdit edecek veya
          verilere yetkisiz erişim sağlayacak eylemlerde bulunmamak,
        </li>
        <li>
          Platform içeriğini izinsiz kopyalamamak, çoğaltmamak veya ticari
          amaçla kullanmamak (veri kazıma/scraping dâhil).
        </li>
      </UL>
      <P>Platform, 18 yaşını doldurmuş kişilerin kullanımına yöneliktir.</P>

      <H2>5. Uzman Profilleri ve Doğruluk</H2>
      <P>
        Uzman profillerindeki bilgiler; uzmanın kendisinden ve kamuya açık
        kaynaklardan derlenmektedir. Terapimap, bu bilgilerin doğruluğunu ve
        güncelliğini sağlamak için makul çabayı gösterir; ancak{' '}
        <Strong>
          uzmanların yetkinliği, unvanlarının geçerliliği, sundukları
          hizmetin niteliği ve sonuçları konusunda hiçbir garanti vermez
        </Strong>
        . Kullanıcıların, hizmet almadan önce uzmanın yeterliliğini ve
        belgelerini kendilerinin doğrulaması önerilir. Ayrıntılar için{' '}
        <a
          href={`/${locale}/terapist-profil-politikasi`}
          className="underline hover:text-brand-900"
        >
          Terapist Profil Politikası
        </a>
        &apos;na bakınız.
      </P>

      <H2>6. Sorumluluğun Sınırlandırılması</H2>
      <UL>
        <li>
          Terapimap; danışan ile uzman arasındaki iletişimden, kurulan hizmet
          ilişkisinden, verilen hizmetin içeriğinden ve sonuçlarından sorumlu
          değildir.
        </li>
        <li>
          Platform &quot;olduğu gibi&quot; sunulmaktadır; kesintisiz, hatasız
          veya güvenlik açıklarından tamamen arınmış olacağı garanti edilmez.
        </li>
        <li>
          Uzman profillerindeki bilgilerin eksik veya güncel olmamasından
          doğabilecek zararlardan, kanunen sorumluluğun kaldırılamayacağı
          hâller saklı kalmak üzere, Terapimap sorumlu tutulamaz.
        </li>
        <li>
          Üçüncü taraf sitelere verilen bağlantıların içeriklerinden
          Terapimap sorumlu değildir.
        </li>
      </UL>

      <H2>7. Fikri Mülkiyet</H2>
      <P>
        Platformun tasarımı, yazılımı, markası, logosu ve özgün içerikleri
        Terapimap&apos;a aittir ve ilgili mevzuat uyarınca korunmaktadır.
        Yazılı izin olmaksızın kopyalanamaz, çoğaltılamaz ve dağıtılamaz.
        Uzman profillerindeki bilgiler ve fotoğraflar üzerindeki haklar ilgili
        uzmanlara aittir.
      </P>

      <H2>8. Kişisel Verilerin Korunması</H2>
      <P>
        Kişisel verilerin işlenmesine ilişkin esaslar{' '}
        <a
          href={`/${locale}/kvkk-aydinlatma-metni`}
          className="underline hover:text-brand-900"
        >
          KVKK Aydınlatma Metni
        </a>{' '}
        ve{' '}
        <a
          href={`/${locale}/gizlilik-politikasi`}
          className="underline hover:text-brand-900"
        >
          Gizlilik Politikası
        </a>
        &apos;nda düzenlenmiştir. Danışan verileri yalnızca ilgili uzmana
        iletilir.
      </P>

      <H2>9. Değişiklikler</H2>
      <P>
        Terapimap, işbu Koşulları dilediği zaman güncelleyebilir. Güncel
        Koşullar bu sayfada yayımlandığı tarihte yürürlüğe girer; Platformun
        kullanılmaya devam edilmesi, güncel Koşulların kabulü anlamına gelir.
      </P>

      <H2>10. Uygulanacak Hukuk ve Yetki</H2>
      <P>
        İşbu Koşullar Türkiye Cumhuriyeti hukukuna tabidir. Koşullardan doğan
        uyuşmazlıklarda Türkiye Cumhuriyeti mahkemeleri ve icra daireleri
        yetkilidir.
      </P>

      <H2>11. İletişim</H2>
      <P>
        Her türlü soru ve bildirim için:{' '}
        <Strong>iletisim@terapimap.com</Strong>
      </P>
    </LegalDoc>
  );
}
