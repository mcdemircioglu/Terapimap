import type { Metadata } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';
import { LegalDoc, H2, P, UL, Strong } from '@/components/LegalDoc';
import { absUrl } from '@/lib/schema';

const TITLE = 'KVKK Aydınlatma Metni';
const UPDATED = '6 Temmuz 2026';

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Metadata {
  return {
    title: `${TITLE} | Terapimap`,
    description:
      '6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Terapimap aydınlatma metni.',
    alternates: { canonical: absUrl(`/${locale}/kvkk-aydinlatma-metni`) },
    robots: { index: true, follow: true },
  };
}

export default function KvkkPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);

  return (
    <LegalDoc title={TITLE} updatedAt={UPDATED}>
      <H2>1. Veri Sorumlusu</H2>
      <P>
        İşbu Aydınlatma Metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu
        (&quot;<Strong>KVKK</Strong>&quot;) uyarınca,{' '}
        <Strong>Terapimap</Strong> (&quot;<Strong>Platform</Strong>&quot;)
        tarafından veri sorumlusu sıfatıyla, terapimap.com adresinde faaliyet
        gösteren platformun kullanıcılarını kişisel verilerinin işlenmesine
        ilişkin olarak bilgilendirmek amacıyla hazırlanmıştır.
      </P>
      <P>
        İletişim: <Strong>iletisim@terapimap.com</Strong>
      </P>

      <H2>2. Platformun Niteliği</H2>
      <P>
        Terapimap; danışanlar ile psikolog, psikolojik danışman, aile
        danışmanı, klinik psikolog ve psikiyatristleri buluşturan bir çevrim
        içi dizin (rehber) platformudur. Terapimap{' '}
        <Strong>
          terapi hizmeti veya herhangi bir sağlık hizmeti sunmaz
        </Strong>
        ; yalnızca kullanıcıların ruh sağlığı uzmanlarını bulmasına ve onlarla
        iletişime geçmesine aracılık eder. Platform üzerinden herhangi bir
        seans, teşhis veya tedavi süreci yürütülmez ve bu süreçlere ilişkin
        sağlık verisi işlenmez.
      </P>

      <H2>3. İşlenen Kişisel Veriler</H2>
      <P>
        <Strong>a) Danışanlara (ziyaretçilere) ait veriler:</Strong> İletişim
        formu aracılığıyla bir uzmana ulaşmak istediğinizde;
      </P>
      <UL>
        <li>Ad ve soyad,</li>
        <li>Telefon numarası,</li>
        <li>E-posta adresi,</li>
        <li>İletmek istediğiniz mesaj içeriği</li>
      </UL>
      <P>
        işlenmektedir. Mesaj alanına sağlık durumunuza ilişkin özel nitelikli
        kişisel veri yazmamanızı öneririz; bu alana yazdığınız bilgiler
        yalnızca seçtiğiniz uzmana iletilmek amacıyla işlenir.
      </P>
      <P>
        <Strong>b) Uzmanlara (terapistlere) ait veriler:</Strong> Ad soyad,
        unvan, uzmanlık alanları, eğitim bilgileri, mesleki deneyim, şehir,
        adres, telefon, e-posta, web sitesi, sosyal medya hesapları, profil
        fotoğrafı ve hakkında bilgisi. Ayrıntılar için{' '}
        <a
          href={`/${locale}/terapist-profil-politikasi`}
          className="underline hover:text-brand-900"
        >
          Terapist Profil Politikası
        </a>
        &apos;na bakınız.
      </P>
      <P>
        <Strong>c) İşlem güvenliği verileri:</Strong> IP adresi, tarayıcı ve
        cihaz bilgileri, erişim kayıtları (log) ve çerezler aracılığıyla
        toplanan teknik veriler.
      </P>

      <H2>4. Kişisel Verilerin İşlenme Amaçları</H2>
      <UL>
        <li>
          Danışanların seçtikleri uzmana iletişim taleplerinin iletilmesi,
        </li>
        <li>Uzman profillerinin dizin hizmeti kapsamında yayınlanması,</li>
        <li>
          Profil doğrulama, güncelleme ve kaldırma taleplerinin yönetilmesi,
        </li>
        <li>Platformun işletilmesi, güvenliğinin ve sürekliliğinin sağlanması,</li>
        <li>Hukuki yükümlülüklerin yerine getirilmesi,</li>
        <li>Talep ve şikâyetlerin sonuçlandırılması.</li>
      </UL>

      <H2>5. Kişisel Verilerin Toplanma Yöntemi ve Hukuki Sebepleri</H2>
      <P>
        Kişisel veriler; Platform üzerindeki formlar, e-posta yazışmaları,
        çerezler ve uzman verileri bakımından ayrıca uzmanın kendisi ile
        kamuya açık kaynaklar (uzmanın kendi web sitesi, sosyal medya
        hesapları ve kamuya açık mesleki rehberler) aracılığıyla, kısmen veya
        tamamen otomatik yollarla toplanmaktadır.
      </P>
      <P>KVKK&apos;nın 5. maddesi uyarınca dayanılan hukuki sebepler:</P>
      <UL>
        <li>
          <Strong>m. 5/2-c:</Strong> Bir sözleşmenin kurulması veya ifasıyla
          doğrudan doğruya ilgili olması (iletişim talebinizin seçtiğiniz
          uzmana iletilmesi),
        </li>
        <li>
          <Strong>m. 5/2-d:</Strong> İlgili kişinin kendisi tarafından
          alenileştirilmiş olması (uzmanların kamuya açık mesleki bilgileri),
        </li>
        <li>
          <Strong>m. 5/2-f:</Strong> İlgili kişinin temel hak ve
          özgürlüklerine zarar vermemek kaydıyla veri sorumlusunun meşru
          menfaati (platformun işletilmesi ve güvenliği),
        </li>
        <li>
          <Strong>m. 5/2-ç:</Strong> Hukuki yükümlülüklerin yerine
          getirilmesi,
        </li>
        <li>
          Yukarıdaki sebeplerin bulunmadığı hâllerde <Strong>açık rıza</Strong>{' '}
          (m. 5/1).
        </li>
      </UL>

      <H2>6. Kişisel Verilerin Aktarılması</H2>
      <UL>
        <li>
          <Strong>Danışan verileri yalnızca, danışanın iletişim formunda
          seçtiği ilgili uzmana iletilir.</Strong> Bu veriler başka hiçbir
          uzmana, üçüncü kişiye satılmaz, kiralanmaz veya pazarlama amacıyla
          paylaşılmaz.
        </li>
        <li>
          Yetkili kamu kurum ve kuruluşlarına, yalnızca hukuki yükümlülük
          kapsamında ve talep hâlinde aktarım yapılabilir.
        </li>
        <li>
          Platform; barındırma ve altyapı hizmetleri için Vercel, Supabase ve
          Cloudflare hizmet sağlayıcılarını kullanmaktadır. Bu sağlayıcıların
          sunucuları yurt dışında bulunabildiğinden, verileriniz KVKK&apos;nın
          9. maddesindeki şartlara uygun olarak yurt dışına aktarılabilmektedir.
        </li>
      </UL>

      <H2>7. Saklama Süresi</H2>
      <P>
        Kişisel veriler, işlenme amacının gerektirdiği süre ve ilgili
        mevzuatta öngörülen zamanaşımı süreleri boyunca saklanır; sürenin
        sonunda silinir, yok edilir veya anonim hâle getirilir. İletişim formu
        kayıtları, talebin uzmana iletilmesinden itibaren en fazla 2 yıl
        süreyle saklanır.
      </P>

      <H2>8. KVKK Kapsamındaki Haklarınız</H2>
      <P>KVKK&apos;nın 11. maddesi uyarınca herkes;</P>
      <UL>
        <li>Kişisel verilerinin işlenip işlenmediğini öğrenme,</li>
        <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
        <li>
          İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını
          öğrenme,
        </li>
        <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
        <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
        <li>
          KVKK&apos;nın 7. maddesindeki şartlar çerçevesinde silinmesini veya
          yok edilmesini isteme,
        </li>
        <li>
          Düzeltme, silme ve yok etme işlemlerinin, verilerin aktarıldığı
          üçüncü kişilere bildirilmesini isteme,
        </li>
        <li>
          Münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhine
          bir sonucun ortaya çıkmasına itiraz etme,
        </li>
        <li>
          Kanuna aykırı işleme sebebiyle zarara uğraması hâlinde zararın
          giderilmesini talep etme
        </li>
      </UL>
      <P>haklarına sahiptir.</P>

      <H2>9. Başvuru Yöntemi</H2>
      <P>
        Yukarıdaki haklarınıza ilişkin taleplerinizi, Veri Sorumlusuna Başvuru
        Usul ve Esasları Hakkında Tebliğ&apos;e uygun olarak{' '}
        <Strong>iletisim@terapimap.com</Strong> adresine iletebilirsiniz.
        Başvurunuz, niteliğine göre en kısa sürede ve en geç{' '}
        <Strong>30 (otuz) gün</Strong> içinde ücretsiz olarak sonuçlandırılır.
        Başvurunuzun reddedilmesi veya cevabın yetersiz bulunması hâlinde
        Kişisel Verileri Koruma Kurulu&apos;na şikâyette bulunma hakkınız
        saklıdır.
      </P>

      <H2>10. Değişiklikler</H2>
      <P>
        Terapimap, işbu Aydınlatma Metni&apos;ni mevzuat değişiklikleri veya
        işleme faaliyetlerindeki değişiklikler doğrultusunda güncelleyebilir.
        Güncel metin, bu sayfada yayımlandığı tarihte yürürlüğe girer.
      </P>
    </LegalDoc>
  );
}
