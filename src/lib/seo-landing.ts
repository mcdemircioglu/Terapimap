import { getPublicClient } from '@/lib/supabase/server';
import { getLocativeSuffix } from '@/lib/utils';
import { absUrl } from '@/lib/schema';
import { CITIES } from '@/lib/cities';
import type { ArticleCategory } from '@/types/database';
import type { Specialty } from '@/types/database';

/**
 * Şehir + uzmanlık SEO landing içeriği üretimi.
 * Öncelik sırası: seo_landing_pages özel içerik → specialties.seo_* → şablon.
 * DB kolonları/tablosu henüz yoksa sessizce şablona düşer.
 */

export type LandingFaq = { q: string; a: string };

export type LandingSection = { heading: string; paragraphs: string[] };

export type LandingCopy = {
  h1: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  sections: LandingSection[];
  faqs: LandingFaq[];
  isIndexable: boolean;
};

/**
 * Thin content eşiği: bir şehir/uzmanlık kombinasyon sayfası, listelenen
 * uzman sayısı bu değerin ALTINDAYSA index edilmez (noindex, follow).
 * total === 1 olan sayfalar da noindex olur; tek bir profille sınırlı bir
 * sayfa Google için "thin content" sinyaline daha yakındır ve site
 * genelinde çok sayıda benzer tek-profilli sayfa oluşmasını önler.
 * 2'ye ayarlandı (1 değil) çünkü daha temkinli bir eşiktir: mevcut
 * dağılıma dair veri olmadığından, index'i tamamen kapatmak yerine en
 * azından "birden fazla seçenek sunan" sayfaları indexlenebilir tutar.
 */
const MIN_THERAPISTS_FOR_INDEX = 2;

/* ── Uzmanlık kısaltması: "Bilişsel Davranışçı Terapi (BDT)" → "BDT" ── */
export function shortSpecialtyName(name: string): string {
  const m = name.match(/\(([^)]+)\)/);
  return m ? m[1] : name;
}

/* ── Bilinen uzmanlıklar için özel "nedir" içeriği ─────────────────── */
type SpecialtyInfo = { whatIs: string; suitableFor: string };

const SPECIALTY_INFO: { keywords: string[]; info: SpecialtyInfo }[] = [
  {
    keywords: ['sosyal kaygı'],
    info: {
      whatIs:
        `Sosyal kaygı, başkaları tarafından değerlendirilme veya olumsuz yargılanma korkusuyla ortaya çıkan, sosyal ortamlarda belirgin bir gerginlik ve kaçınma haliyle kendini gösterebilen bir kaygı türüdür. Bu alanda çalışan uzmanlar, kaygının tetikleyicilerini anlamak ve sosyal ortamlarda daha rahat hissetmeyi destekleyecek beceriler kazandırmak üzerine odaklanır.`,
      suitableFor:
        `Toplum önünde konuşma, tanışma ortamları veya grup içi etkileşimlerde yoğun kaygı, kızarma, terleme ya da kaçınma davranışları yaşayanlar bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['sınav kaygı'],
    info: {
      whatIs:
        `Sınav kaygısı, sınav öncesinde veya sırasında yaşanan yoğun gerginlik, odaklanma güçlüğü ve performans düşüşüyle kendini gösterebilen, öğrenciler arasında sık görülen bir durumdur. Bu alanda çalışan uzmanlar, kaygıyı yönetme becerileri ve çalışma/sınav stratejileri geliştirmeye destek olur.`,
      suitableFor:
        `Sınav dönemlerinde uykusuzluk, konsantrasyon kaybı veya panik benzeri belirtiler yaşayan öğrenciler ve aileleri bu alanda çalışan bir uzmandan destek almayı değerlendirebilir.`,
    },
  },
  {
    keywords: ['bdt', 'bilişsel davranışçı'],
    info: {
      whatIs:
        'Bilişsel Davranışçı Terapi (BDT), düşünce, duygu ve davranış arasındaki ilişkiyi ele alan, bilimsel araştırmalarla desteklenen yapılandırılmış bir terapi yaklaşımıdır. Seanslarda güncel sorunlara odaklanılır; işlevsel olmayan düşünce kalıplarını fark etmek ve daha esnek bakış açıları geliştirmek hedeflenir.',
      suitableFor:
        'BDT; anksiyete, depresyon, panik bozukluk, takıntılar, sosyal kaygı ve uyku sorunları gibi pek çok alanda yaygın olarak kullanılır. Belirli hedefler üzerinde yapılandırılmış şekilde çalışmak isteyenler için değerlendirilebilecek bir seçenektir.',
    },
  },
  {
    keywords: ['emdr'],
    info: {
      whatIs:
        'EMDR (Göz Hareketleriyle Duyarsızlaştırma ve Yeniden İşleme), zorlayıcı yaşam deneyimlerinin ve travmatik anıların işlenmesine odaklanan bir terapi yöntemidir. Çift yönlü uyarım eşliğinde, rahatsızlık veren anıların duygusal yükünün azaltılması hedeflenir.',
      suitableFor:
        'EMDR özellikle travma sonrası stres, kayıp, kaza ve zorlayıcı yaşam olayları sonrasında destek arayanlar tarafından tercih edilebilir. Yöntemin uygunluğu, uzmanla yapılacak ön değerlendirmede birlikte kararlaştırılır.',
    },
  },
  {
    keywords: ['anksiyete', 'kaygı'],
    info: {
      whatIs:
        'Anksiyete (kaygı), belirsizlik ve tehdit algısına verilen doğal bir tepkidir; ancak günlük yaşamı, uykuyu, işi veya ilişkileri etkileyecek düzeye geldiğinde profesyonel destek almak yardımcı olabilir. Anksiyete alanında çalışan uzmanlar, kaygının kaynağını anlamak ve baş etme becerileri geliştirmek üzerine odaklanır.',
      suitableFor:
        'Sürekli endişe, huzursuzluk, panik atak benzeri yaşantılar, sosyal ortamlarda yoğun kaygı veya kaçınma davranışları yaşayanlar bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.',
    },
  },
  {
    keywords: ['panik bozukluk', 'panik atak'],
    info: {
      whatIs:
        `Panik bozukluk, beklenmedik şekilde ortaya çıkan, çarpıntı, nefes darlığı ve yoğun korku hissiyle seyreden panik atakların tekrarlayıcı şekilde yaşanmasıyla tanımlanır. Terapi sürecinde atakların tetikleyicilerini anlamak ve bedensel tepkilerle baş etme becerileri geliştirmek hedeflenir.`,
      suitableFor:
        `Beklenmedik panik atakları, bir sonraki atak hakkında sürekli endişe veya bu nedenle bazı ortamlardan kaçınma yaşayanlar bu alanda deneyimli bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['okb', 'obsesif'],
    info: {
      whatIs:
        `Obsesif Kompulsif Bozukluk (OKB), istenmeyen ve tekrarlayan düşünceler (obsesyonlar) ile bu düşüncelerin yarattığı rahatsızlığı azaltmak için yapılan tekrarlayan davranışların (kompulsiyonlar) bir arada görülebildiği bir durumdur. Bu alanda çalışan uzmanlar, düşünce-davranış döngüsünü anlamak ve kademeli olarak azaltmak üzerine yapılandırılmış yöntemler kullanır.`,
      suitableFor:
        `Kontrol etme, düzen, temizlik veya istenmeyen düşünceler nedeniyle günlük yaşamı zorlaşan kişiler bu alanda deneyimli bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['fobi'],
    info: {
      whatIs:
        `Fobiler; belirli bir nesne, durum veya canlıya karşı gerçek tehlikeyle orantısız, yoğun ve sürekli bir korku duyulmasıyla tanımlanır. Terapide korkuya neden olan uyaranla güvenli ve kademeli bir şekilde yüzleşme çalışmaları sıklıkla kullanılır.`,
      suitableFor:
        `Yükseklik, uçuş, iğne, kapalı alan veya belirli hayvanlara karşı günlük yaşamı etkileyecek düzeyde korku yaşayanlar bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['bipolar'],
    info: {
      whatIs:
        `Bipolar bozukluk, duygudurumda belirgin iniş çıkışlarla; çökkünlük (depresif) dönemler ile enerji ve coşkunun arttığı (manik veya hipomanik) dönemlerin görülebildiği bir ruh sağlığı durumudur. Süreç genellikle psikiyatrist takibi ile terapi desteğinin birlikte yürütülmesini gerektirir.`,
      suitableFor:
        `Duygudurumunda belirgin dalgalanmalar yaşayan veya bipolar bozukluk tanısı almış kişiler, hem psikiyatrik takip hem de terapi desteği için ilgili uzmanları değerlendirebilir.`,
    },
  },
  {
    keywords: ['doğum sonrası'],
    info: {
      whatIs:
        `Doğum sonrası depresyon, doğumdan sonraki dönemde ortaya çıkabilen; yoğun üzüntü, tükenmişlik, bebeğe karşı bağ kurmakta güçlük gibi belirtilerle kendini gösterebilen bir durumdur. Bu dönemde alınan destek, hem anne hem de bebek için önemli bir fark yaratabilir.`,
      suitableFor:
        `Doğum sonrası dönemde sürekli üzüntü, aşırı yorgunluk, kaygı veya bebeğiyle bağ kurmakta zorluk yaşayan anneler bu alanda deneyimli bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['depresyon'],
    info: {
      whatIs:
        'Depresyon; süregelen isteksizlik, enerji düşüklüğü, uyku ve iştah değişiklikleri ile kendini gösterebilen yaygın bir ruh sağlığı durumudur. Terapi sürecinde duyguları anlamak, günlük işlevselliği desteklemek ve kişiye uygun baş etme yolları geliştirmek hedeflenir.',
      suitableFor:
        'Uzun süredir keyif alamama, umutsuzluk, odaklanma güçlüğü veya sosyal geri çekilme yaşayanlar bir uzmanla görüşmeyi değerlendirebilir. Belirtiler yoğunsa psikiyatrist değerlendirmesi de sürece eşlik edebilir.',
    },
  },
  {
    keywords: ['travma'],
    info: {
      whatIs:
        'Travma alanında çalışan uzmanlar; kaza, kayıp, doğal afet, ihmal veya istismar gibi zorlayıcı yaşantıların ardından ortaya çıkabilen belirtilerle çalışır. Terapide güvenlik duygusunu yeniden kurmak ve yaşantıyı işlemek ön plandadır.',
      suitableFor:
        'Zorlayıcı bir olayın ardından kâbuslar, aşırı tetikte olma, kaçınma veya duygusal küntlük yaşayanlar travma alanında deneyimli bir uzmanla görüşmeyi değerlendirebilir.',
    },
  },
  {
    keywords: ['yeme bozuk'],
    info: {
      whatIs:
        `Yeme bozuklukları; yeme davranışı, beden algısı ve kiloyla ilgili yoğun kaygının bir arada görülebildiği, ciddiye alınması gereken durumlardır. Terapi süreci genellikle beslenme uzmanı ve gerektiğinde hekim desteğiyle birlikte yürütülür.`,
      suitableFor:
        `Yeme alışkanlıklarında belirgin değişim, beden algısıyla ilgili yoğun kaygı veya kontrolsüz yeme/kısıtlama döngüleri yaşayanlar bu alanda deneyimli bir uzmandan destek almayı değerlendirebilir.`,
    },
  },
  {
    keywords: ['uyku sorun'],
    info: {
      whatIs:
        `Uyku sorunları; uykuya dalmakta güçlük, sık uyanma veya dinlendirici olmayan uyku gibi biçimlerde ortaya çıkabilir ve çoğu zaman stres, kaygı veya günlük alışkanlıklarla ilişkilidir. Terapide uyku düzenini etkileyen düşünce ve davranış örüntüleri birlikte değerlendirilir.`,
      suitableFor:
        `Uzun süredir devam eden uyku sorunları yaşayan ve bunun günlük yaşamını etkilediğini fark eden kişiler bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['dehb', 'hiperaktivite'],
    info: {
      whatIs:
        `Dikkat Eksikliği ve Hiperaktivite Bozukluğu (DEHB); dikkati sürdürmede güçlük, hareketlilik ve dürtüsellik gibi belirtilerle kendini gösterebilir ve hem çocuklarda hem yetişkinlerde görülebilir. Değerlendirme ve destek süreci genellikle psikiyatrist ve terapist iş birliğiyle yürütülür.`,
      suitableFor:
        `Dikkatini sürdürmekte, planlama yapmakta veya dürtülerini yönetmekte zorlanan çocuk, ergen ve yetişkinler bu alanda deneyimli uzmanları değerlendirebilir.`,
    },
  },
  {
    keywords: ['öfke'],
    info: {
      whatIs:
        `Öfke kontrolü, öfke duygusunu tanımak, yoğunluğunu anlamak ve bu duyguyu yıkıcı olmayan şekillerde ifade etme becerisi geliştirmeye odaklanan bir çalışma alanıdır. Terapide öfkeyi tetikleyen durumlar ve altında yatan ihtiyaçlar birlikte incelenir.`,
      suitableFor:
        `Sık sık kontrolünü kaybettiğini hisseden, öfke patlamaları yaşayan veya bu durumun ilişkilerini etkilediğini düşünen kişiler bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['tükenmişlik', 'stres ve tükenmiş'],
    info: {
      whatIs:
        `Stres ve tükenmişlik; uzun süreli yoğun iş yükü, sorumluluk veya baskı altında kalmanın yol açtığı fiziksel ve duygusal yorgunluk halini ifade eder. Terapide stres kaynaklarını fark etmek ve sürdürülebilir baş etme yolları geliştirmek hedeflenir.`,
      suitableFor:
        `İşte veya günlük yaşamda sürekli yorgunluk, motivasyon kaybı veya tükenmişlik hissi yaşayanlar bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['özgüven'],
    info: {
      whatIs:
        `Özgüven ve benlik saygısı çalışmaları, kişinin kendine dair değerlendirmelerini, kendine olan güvenini ve kendiyle kurduğu ilişkiyi güçlendirmeye odaklanır. Terapide olumsuz benlik algısının kaynakları anlaşılmaya çalışılır ve daha dengeli bir öz değerlendirme geliştirilmesi desteklenir.`,
      suitableFor:
        `Sürekli kendini yetersiz hisseden, karar almakta zorlanan veya başkalarının onayına aşırı ihtiyaç duyan kişiler bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['yas ve kayıp'],
    info: {
      whatIs:
        `Yas ve kayıp süreci, bir yakının kaybı veya önemli bir yaşam kaybı sonrasında yaşanan doğal ama zorlayıcı duygusal sürecin adıdır. Terapide bu sürecin kişiye özgü hızda ve güvenli bir ortamda deneyimlenmesine alan açılır.`,
      suitableFor:
        `Bir kayıp sonrası yoğun üzüntü, öfke, suçluluk veya günlük yaşama dönmekte güçlük yaşayanlar bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['bağımlılık'],
    info: {
      whatIs:
        `Bağımlılık; madde, alkol veya belirli davranışlar üzerinde kontrolün giderek zorlaştığı, günlük yaşamı olumsuz etkileyen bir durumdur. Destek süreci genellikle terapi, gerektiğinde tıbbi takip ve bazen grup temelli yaklaşımları bir arada içerir.`,
      suitableFor:
        `Kendisinde veya bir yakınında bağımlılıkla ilişkili bir örüntü fark eden kişiler bu alanda deneyimli bir uzmanla görüşerek uygun destek yollarını değerlendirebilir.`,
    },
  },
  {
    keywords: ['oyun bağımlılığı', 'teknoloji bağımlılığı'],
    info: {
      whatIs:
        `Teknoloji ve oyun bağımlılığı; internet, sosyal medya veya dijital oyunların günlük işlevselliği, uykuyu ve sosyal ilişkileri olumsuz etkileyecek düzeyde kullanılmasını ifade eder. Terapide kullanım örüntüsünü anlamak ve dengeli bir kullanım alışkanlığı geliştirmek hedeflenir.`,
      suitableFor:
        `Ekran süresini kontrol etmekte zorlanan, bu nedenle sosyal ve akademik yaşamı etkilenen çocuk, ergen ve yetişkinlerin aileleri bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['kişilik bozuk'],
    info: {
      whatIs:
        `Kişilik bozuklukları; düşünce, duygu ve davranış örüntülerinin kişinin ilişkilerini ve işlevselliğini uzun süreli ve belirgin şekilde etkilediği durumları kapsar. Bu alanda genellikle uzun soluklu ve yapılandırılmış bir terapi süreci önerilir.`,
      suitableFor:
        `İlişkilerinde tekrarlayan zorluklar yaşayan veya bir kişilik bozukluğu değerlendirmesi almış kişiler bu alanda deneyimli bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['ilişki sorun'],
    info: {
      whatIs:
        `İlişki sorunları; arkadaşlık, aile veya romantik ilişkilerdeki iletişim güçlükleri, güven sorunları veya tekrarlayan çatışmaları kapsayan geniş bir alandır. Terapide ilişki örüntülerini anlamak ve daha sağlıklı iletişim becerileri geliştirmek hedeflenir.`,
      suitableFor:
        `İlişkilerinde sık çatışma, iletişim kopukluğu veya güven sorunları yaşayan kişiler bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['boşanma'],
    info: {
      whatIs:
        `Boşanma ve ayrılık süreci; duygusal, pratik ve bazen hukuki pek çok zorluğu bir arada getirebilen zorlu bir yaşam geçişidir. Terapide bu sürecin duygusal yükünü azaltmak ve yeni bir düzene uyum sağlamak desteklenir.`,
      suitableFor:
        `Boşanma veya ayrılık sürecinde olan ya da bu süreci yeni tamamlamış kişiler, bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['ebeveyn'],
    info: {
      whatIs:
        `Ebeveynlik alanında çalışan uzmanlar; çocuk gelişimi, sınır koyma, iletişim ve ebeveyn-çocuk ilişkisiyle ilgili konularda ailelere destek olur. Amaç, ebeveynin kendi ebeveynlik tarzını daha bilinçli şekilde şekillendirmesine yardımcı olmaktır.`,
      suitableFor:
        `Çocuğuyla iletişimde zorlanan, sınır koymakta güçlük çeken veya ebeveynlik konusunda destek almak isteyen ebeveynler bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['cinsel işlev'],
    info: {
      whatIs:
        `Cinsel işlev sorunları; cinsel istek, uyarılma veya doyumla ilgili yaşanan güçlükleri kapsar ve fiziksel, psikolojik veya ilişkisel pek çok etkene bağlı olabilir. Bu alanda çalışan uzmanlar, konuyu gizlilik ve güvenli bir ortamda ele alır.`,
      suitableFor:
        `Cinsel yaşamıyla ilgili süregelen bir güçlük yaşayan bireyler veya çiftler bu alanda deneyimli bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['bağlanma'],
    info: {
      whatIs:
        `Bağlanma sorunları; erken dönem ilişkilerde şekillenen bağlanma örüntülerinin, yetişkinlikteki ilişkilerde güven kurma, yakınlık veya bağımsızlık dengesini etkilemesiyle ilişkilidir. Terapide bu örüntülerin fark edilmesi ve daha güvenli bir ilişki biçimi geliştirilmesi desteklenir.`,
      suitableFor:
        `İlişkilerinde tekrarlayan güven sorunları, yakınlıktan kaçınma veya terk edilme korkusu yaşayan kişiler bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['kronik hastalık'],
    info: {
      whatIs:
        `Kronik hastalık uyumu, uzun süreli bir sağlık sorunuyla yaşamayı öğrenme sürecinde ortaya çıkabilen duygusal zorlukları ele alır. Terapide hastalıkla ilişkili kaygı, tükenmişlik ve yaşam düzenindeki değişimlere uyum sağlama süreçleri desteklenir.`,
      suitableFor:
        `Kronik bir sağlık sorunuyla yaşayan veya bir yakınına bakım veren kişiler bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['kendine zarar'],
    info: {
      whatIs:
        `Kendine zarar verme, yoğun duygusal sıkıntıyla baş etmenin bir yolu olarak ortaya çıkabilen, ciddiye alınması ve profesyonel destekle ele alınması gereken bir durumdur. Bu alanda çalışan uzmanlar, altta yatan duygusal zorlukları anlamak ve daha güvenli baş etme yolları geliştirmek üzerine çalışır.`,
      suitableFor:
        `Kendisinde veya bir yakınında bu tür davranışlar fark eden kişilerin vakit kaybetmeden bu alanda deneyimli bir uzmandan veya bir sağlık kuruluşundan destek alması önemlidir.`,
    },
  },
  {
    keywords: ['göç ve kültürel', 'kültürel uyum'],
    info: {
      whatIs:
        `Göç ve kültürel uyum, yeni bir ülke, şehir veya kültürel ortama uyum sağlama sürecinde yaşanabilen kimlik, aidiyet ve iletişimle ilgili zorlukları ele alır. Terapide bu geçiş sürecinin duygusal yükünü hafifletmek ve yeni ortama uyumu desteklemek hedeflenir.`,
      suitableFor:
        `Yeni bir şehre veya ülkeye taşınan, kültürel uyum sürecinde zorlanan kişiler bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['yaşam dengesi'],
    info: {
      whatIs:
        `İş-yaşam dengesi, iş sorumlulukları ile kişisel yaşam arasında sürdürülebilir bir denge kurmakla ilgili zorlukları kapsar. Terapide öncelikleri netleştirmek ve sınır koyma becerileri geliştirmek üzerine çalışılır.`,
      suitableFor:
        `İş yoğunluğu nedeniyle kişisel yaşamına zaman ayıramadığını hisseden veya sürekli yorgun hisseden çalışanlar bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['sosyal beceri'],
    info: {
      whatIs:
        `Sosyal beceri gelişimi, iletişim kurma, sınır koyma ve ilişki başlatma/sürdürme gibi sosyal etkileşim becerilerini geliştirmeye odaklanan bir çalışma alanıdır. Bu çalışmalar çocuklarda, ergenlerde ve yetişkinlerde farklı biçimlerde uygulanabilir.`,
      suitableFor:
        `Sosyal ortamlarda kendini ifade etmekte zorlanan çocuk, ergen ve yetişkinler bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['davranış sorun'],
    info: {
      whatIs:
        `Davranış sorunları; özellikle çocukluk ve ergenlik döneminde görülen, kurallara uymakta güçlük, öfke patlamaları veya uyumsuzluk gibi belirtilerle kendini gösterebilen bir alandır. Terapide davranışın altında yatan ihtiyaç ve tetikleyiciler anlaşılmaya çalışılır.`,
      suitableFor:
        `Çocuğunun veya ergeninin davranışlarıyla ilgili endişe duyan aileler bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['somatik'],
    info: {
      whatIs:
        `Somatik belirtiler, tıbbi bir açıklaması net olarak bulunamayan ağrı, yorgunluk veya diğer bedensel yakınmaların, duygusal durumla ilişkili olabileceği durumları ifade eder. Terapide beden ve duygu arasındaki bağlantı birlikte değerlendirilir.`,
      suitableFor:
        `Tıbbi değerlendirmelerde açık bir neden bulunamayan sürekli bedensel yakınmalar yaşayan kişiler, hekim takibiyle birlikte bu alanda çalışan bir uzmanı da değerlendirebilir.`,
    },
  },
  {
    keywords: ['bilişsel analitik'],
    info: {
      whatIs:
        `Bilişsel Analitik Terapi (CAT), bilişsel ve psikodinamik yaklaşımların unsurlarını bir araya getiren, kişinin kendisi ve başkalarıyla kurduğu tekrarlayan ilişki örüntülerini anlamaya odaklanan zaman sınırlı bir terapi yöntemidir. Süreçte bu örüntülerin fark edilmesi ve değiştirilmesi hedeflenir.`,
      suitableFor:
        `İlişkilerinde tekrar eden örüntüleri anlamak ve zaman sınırlı, yapılandırılmış bir terapi süreci arayan kişiler bu yöntemi uygulayan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['şema terapi'],
    info: {
      whatIs:
        `Şema terapi, çocukluktan itibaren gelişen ve yetişkinlikte tekrarlayan zorlayıcı örüntülere (şemalara) yol açabilen kök inançları ele alan, bütüncül bir terapi yaklaşımıdır. Bilişsel, duygu odaklı ve ilişkisel teknikleri bir arada kullanır.`,
      suitableFor:
        `Uzun süredir devam eden ilişki örüntüleri veya derin yerleşmiş olumsuz inançlarla çalışmak isteyen kişiler bu yöntemi uygulayan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['kararlılık terapisi', 'act (kabul'],
    info: {
      whatIs:
        `ACT (Kabul ve Kararlılık Terapisi), zorlayıcı düşünce ve duygularla mücadele etmek yerine onları kabullenmeyi, buna karşın kişisel değerlere uygun şekilde hareket etmeyi destekleyen bir terapi yaklaşımıdır. Farkındalık temelli teknikler sıklıkla kullanılır.`,
      suitableFor:
        `Zorlayıcı düşünce ve duygularla mücadele etmek yerine değerlerine uygun bir yaşam kurmaya odaklanmak isteyen kişiler bu yöntemi uygulayan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['dbt', 'diyalektik'],
    info: {
      whatIs:
        `DBT (Diyalektik Davranışçı Terapi), yoğun duygu durumlarını düzenlemeye, sıkıntı toleransını artırmaya ve ilişkilerde etkili iletişim becerileri geliştirmeye odaklanan yapılandırılmış bir terapi yöntemidir. Bireysel görüşmelerin yanı sıra beceri eğitimi bileşenleri de içerebilir.`,
      suitableFor:
        `Duygu durumunu düzenlemekte zorlanan, yoğun duygusal iniş çıkışlar yaşayan kişiler bu yöntemi uygulayan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['psikanaliz', 'psikodinamik'],
    info: {
      whatIs:
        `Psikanaliz ve psikodinamik terapi, bilinçdışı süreçlerin, erken yaşam deneyimlerinin ve tekrarlayan ilişki örüntülerinin bugünkü zorluklar üzerindeki etkisini anlamaya odaklanan, genellikle uzun soluklu bir terapi yaklaşımıdır.`,
      suitableFor:
        `Kendini ve geçmiş deneyimlerinin bugünkü yaşamına etkisini derinlemesine anlamak isteyen kişiler bu yöntemi uygulayan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['gestalt'],
    info: {
      whatIs:
        `Gestalt terapi, kişinin şu anki farkındalığına, duygularına ve bedensel deneyimine odaklanan; geçmişten çok "burada ve şimdi"yi merkeze alan bir terapi yaklaşımıdır.`,
      suitableFor:
        `Anlık deneyimlerine ve farkındalığına odaklanarak çalışmak isteyen kişiler bu yöntemi uygulayan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['varoluşçu'],
    info: {
      whatIs:
        `Varoluşçu terapi; anlam, özgürlük, sorumluluk ve ölümlülük gibi temel yaşam temalarıyla kişinin kendi deneyimi üzerinden yüzleşmesine alan açan bir terapi yaklaşımıdır.`,
      suitableFor:
        `Yaşamının anlamı, yönü veya önemli kararlarıyla ilgili derin sorular üzerine düşünmek isteyen kişiler bu yöntemi uygulayan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['çözüm odaklı'],
    info: {
      whatIs:
        `Çözüm odaklı kısa terapi, sorunun kendisinden çok kişinin güçlü yanlarına ve olası çözümlere odaklanan, görece kısa süreli bir terapi yaklaşımıdır. Somut ve ulaşılabilir hedefler belirlemek sürecin merkezindedir.`,
      suitableFor:
        `Belirli bir soruna odaklanarak kısa sürede somut adımlar atmak isteyen kişiler bu yöntemi uygulayan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['mindfulness'],
    info: {
      whatIs:
        `Mindfulness (bilinçli farkındalık) temelli terapi, şimdiki ana yargısız bir dikkatle odaklanmayı öğreten tekniklerle stres, kaygı ve duygu düzenlemeye destek olan bir yaklaşımdır.`,
      suitableFor:
        `Stres, kaygı veya zihinsel yoğunluk yaşayan ve farkındalık temelli teknikler öğrenmek isteyen kişiler bu yöntemi uygulayan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['oyun terapisi'],
    info: {
      whatIs:
        `Oyun terapisi, çocukların duygularını ve deneyimlerini kelimelerden çok oyun aracılığıyla ifade etmelerine olanak tanıyan, çocuklara özgü bir terapi yöntemidir.`,
      suitableFor:
        `Duygusal veya davranışsal zorluklar yaşayan çocuklar için ebeveynler bu yöntemi uygulayan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['sanat terapisi'],
    info: {
      whatIs:
        `Sanat terapisi, resim, boyama veya diğer yaratıcı ifade biçimlerini kullanarak duyguların sözel olmayan yollarla ifade edilmesine ve işlenmesine olanak tanıyan bir terapi yöntemidir.`,
      suitableFor:
        `Duygularını sözel olarak ifade etmekte zorlanan veya yaratıcı bir süreçle çalışmak isteyen kişiler bu yöntemi uygulayan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['aile terapisi'],
    info: {
      whatIs:
        `Aile terapisi, aile üyeleri arasındaki iletişim örüntülerini, rolleri ve tekrarlayan çatışmaları bir bütün olarak ele alan bir terapi alanıdır. Amaç, aile içindeki ilişkileri güçlendirmek ve sağlıklı iletişimi desteklemektir.`,
      suitableFor:
        `Aile içi iletişim sorunları, tekrarlayan çatışmalar veya bir yaşam geçişiyle birlikte zorlanan aileler bu yöntemi uygulayan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['gottman'],
    info: {
      whatIs:
        `Gottman Çift Terapisi, ilişki araştırmalarına dayanan, çiftler arasındaki iletişim, çatışma yönetimi ve yakınlığı güçlendirmeye yönelik somut teknikler sunan yapılandırılmış bir yaklaşımdır.`,
      suitableFor:
        `İlişkilerinde somut ve araştırma temelli tekniklerle çalışmak isteyen çiftler bu yöntemi uygulayan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['çiftler'],
    info: {
      whatIs:
        `Çiftlere yönelik çalışmalar, ilişkideki iletişim, yakınlık ve çatışma yönetimini güçlendirmeye odaklanan, her iki tarafın da sürece dahil olduğu bir terapi alanıdır.`,
      suitableFor:
        `İlişkisini güçlendirmek veya belirli bir sorunu birlikte ele almak isteyen çiftler bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['çift', 'cift', 'evlilik'],
    info: {
      whatIs:
        'Çift terapisi, partnerler arasındaki iletişim örüntülerini, tekrarlayan çatışmaları ve duygusal ihtiyaçları güvenli bir ortamda ele almayı amaçlayan bir terapi alanıdır. Amaç taraflardan birini haklı çıkarmak değil, ilişkinin dinamiklerini birlikte anlamaktır.',
      suitableFor:
        'İletişim sorunları, güven sarsılması, yaşam geçişleri veya ayrılık kararsızlığı yaşayan çiftler bu alanda çalışan bir uzmandan destek almayı değerlendirebilir.',
    },
  },
  {
    keywords: ['eft', 'duygu odaklı'],
    info: {
      whatIs:
        `EFT (Duygu Odaklı Terapi), bireylerin ve çiftlerin duygusal deneyimlerini fark etmelerine ve bu duyguları ilişkilerinde daha sağlıklı şekilde ifade etmelerine odaklanan bir terapi yaklaşımıdır.`,
      suitableFor:
        `Duygularını fark etmekte veya ilişkisinde ifade etmekte zorlanan bireyler ve çiftler bu yöntemi uygulayan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['hipnoterapi'],
    info: {
      whatIs:
        `Hipnoterapi, kişinin gevşemiş ve odaklanmış bir bilinç durumundan yararlanarak belirli hedefler (kaygı azaltma, alışkanlık değişimi gibi) üzerinde çalışmayı amaçlayan bir yöntemdir.`,
      suitableFor:
        `Belirli bir alışkanlık, kaygı veya semptomla hipnoz temelli bir yöntemle çalışmak isteyen kişiler bu yöntemi uygulayan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['cinsel terapi'],
    info: {
      whatIs:
        `Cinsel terapi, bireylerin veya çiftlerin cinsel yaşamlarıyla ilgili yaşadıkları güçlükleri güvenli ve gizlilik ilkesine dayalı bir ortamda ele almalarına destek olan bir terapi alanıdır.`,
      suitableFor:
        `Cinsel yaşamıyla ilgili süregelen bir konuyu bireysel veya partneriyle birlikte ele almak isteyen kişiler bu alanda deneyimli bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['bütüncül'],
    info: {
      whatIs:
        `Bütüncül terapi, tek bir yaklaşıma bağlı kalmak yerine kişinin ihtiyacına göre farklı terapi yöntemlerinin bir arada kullanıldığı esnek bir çalışma biçimidir.`,
      suitableFor:
        `Kendisine özel, esnek ve farklı yöntemleri bir arada barındıran bir terapi süreci isteyen kişiler bu yaklaşımı benimseyen bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['nöropsikiyatri'],
    info: {
      whatIs:
        `Nöropsikiyatri, nörolojik durumlarla ilişkili bilişsel ve duygusal belirtileri değerlendiren ve bu alanda tıbbi takip sağlayan bir uzmanlık dalıdır.`,
      suitableFor:
        `Bilişsel işlevlerde değişim, hafıza sorunları veya nörolojik bir durumla birlikte ruhsal belirtiler yaşayan kişiler bu alanda uzman bir hekimle görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['ergen'],
    info: {
      whatIs:
        `Ergenlere yönelik terapi çalışmaları, kimlik gelişimi, akran ilişkileri, aile içi iletişim ve okul hayatıyla ilgili zorlukları ergenin ihtiyacına uygun bir dilde ele alır.`,
      suitableFor:
        `Duygusal, sosyal veya akademik zorluklar yaşayan ergenler ve aileleri bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['çocuk'],
    info: {
      whatIs:
        `Çocuklara yönelik terapi çalışmaları, gelişim dönemine uygun yöntemlerle çocukların duygusal ve davranışsal ihtiyaçlarını ele almayı amaçlar. Çoğunlukla oyun, resim veya konuşma temelli tekniklerden yararlanılır.`,
      suitableFor:
        `Duygusal veya davranışsal zorluklar yaşayan çocuklar için aileler bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['yaşlı danışan', 'yaşlı '],
    info: {
      whatIs:
        `Yaşlı danışanlara yönelik terapi çalışmaları; yaşlanma sürecine uyum, kayıplar, sağlık değişiklikleri ve yaşam geçişleriyle ilgili duygusal ihtiyaçları ele alır.`,
      suitableFor:
        `Yaşlılık döneminde duygusal destek arayan bireyler ve aileleri bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['yetişkin'],
    info: {
      whatIs:
        `Yetişkinlere yönelik terapi çalışmaları, iş, ilişki, aile ve kişisel gelişimle ilgili geniş bir yelpazedeki konuyu kapsayan genel bir çalışma alanıdır.`,
      suitableFor:
        `Yaşamının herhangi bir alanında destek almak isteyen yetişkinler bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['aileler'],
    info: {
      whatIs:
        `Ailelere yönelik çalışmalar, aile üyeleri arasındaki dinamikleri, iletişimi ve rolleri bir bütün olarak ele alan, tüm aileyi sürece dahil eden bir yaklaşımdır.`,
      suitableFor:
        `Aile içinde tekrarlayan zorluklar yaşayan veya bir yaşam geçişiyle birlikte destek arayan aileler bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['lgbti'],
    info: {
      whatIs:
        `LGBTİ+ danışanlara yönelik terapi çalışmaları, kimlik, aidiyet, aile ve sosyal ilişkilerle ilgili konuları kabul edici ve yargılamayan bir yaklaşımla ele alır.`,
      suitableFor:
        `Kimlikleriyle ilgili destek arayan veya bu alanda deneyimli bir uzmanla çalışmak isteyen LGBTİ+ bireyler ilgili profilleri inceleyebilir.`,
    },
  },
  {
    keywords: ['kadın sağlığı', 'perinatal'],
    info: {
      whatIs:
        `Kadın sağlığı ve perinatal alanı; hamilelik, doğum, doğum sonrası dönem ve kadın yaşam döngüsüne özgü duygusal süreçleri kapsayan bir çalışma alanıdır.`,
      suitableFor:
        `Hamilelik veya doğum sonrası dönemde duygusal destek arayan kadınlar bu alanda deneyimli bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['öğrenci'],
    info: {
      whatIs:
        `Öğrencilere yönelik terapi çalışmaları; akademik baskı, sınav kaygısı, sosyal uyum ve gelecek kaygısı gibi öğrencilik dönemine özgü konuları ele alır.`,
      suitableFor:
        `Akademik veya sosyal zorluklar yaşayan öğrenciler bu alanda çalışan bir uzmanla görüşmeyi değerlendirebilir.`,
    },
  },
  {
    keywords: ['kurumsal'],
    info: {
      whatIs:
        `Kurumsal çalışan desteği, kurumların çalışanlarına sunduğu psikolojik destek hizmetlerini kapsar; iş stresi, tükenmişlik ve iş-yaşam dengesi gibi konularda destek sağlar.`,
      suitableFor:
        `Kurumlar adına çalışanlarına psikolojik destek sağlamak isteyen İK ekipleri veya bu tür bir destekten yararlanmak isteyen çalışanlar ilgili uzmanları değerlendirebilir.`,
    },
  },
];

function getSpecialtyInfo(name: string): SpecialtyInfo {
  const lower = name.toLocaleLowerCase('tr');
  const match = SPECIALTY_INFO.find((s) => s.keywords.some((k) => lower.includes(k)));
  if (match) return match.info;
  return {
    whatIs: `Bu alanda çalışan uzmanlar, ${lower} konusunda eğitim ve deneyime sahip psikolog, psikolojik danışman ve terapistlerdir. Terapi süreci; ihtiyacınızı birlikte anlamak, hedef belirlemek ve size uygun bir çalışma planı oluşturmak üzerine kuruludur.`,
    suitableFor: `${name} alanında destek almayı düşünüyorsanız, uzman profillerindeki eğitim ve deneyim bilgilerini inceleyerek size uygun bir terapist değerlendirebilirsiniz. Terapi süreci kişiye göre değişebilir; ilk görüşme genellikle ihtiyacın netleşmesine yardımcı olur.`,
  };
}

/* ── Şablon üretici ────────────────────────────────────────────────── */

export function buildTemplateCopy({
  cityName,
  specialtyName,
  total,
  onlineCount,
}: {
  cityName: string;
  specialtyName: string;
  total: number;
  onlineCount: number;
}): LandingCopy {
  const short = shortSpecialtyName(specialtyName);
  const da = getLocativeSuffix(cityName); // 'da / 'de
  const daki = getLocativeSuffix(cityName, true); // 'daki / 'deki
  const info = getSpecialtyInfo(specialtyName);
  const specialtyLower = specialtyName.toLocaleLowerCase('tr');

  // Title ≤ ~60 karakter: uzunsa kısaltma kullan
  let metaTitle = `${cityName} ${specialtyName} Terapistleri | Terapimap`;
  if (metaTitle.length > 60) {
    metaTitle = `${cityName} ${short} Terapistleri | Terapimap`;
  }
  if (metaTitle.length > 60) {
    metaTitle = `${cityName} ${short} Uzmanları | Terapimap`;
  }

  const metaDescription = `${cityName}${da} ${specialtyLower} alanında çalışan uzman psikolog ve terapistleri inceleyin. Online ve yüz yüze terapi seçeneklerini karşılaştırın, size uygun uzmanı seçin.`;

  const h1 =
    `${cityName} ${specialtyName} Uzmanları`.length <= 60
      ? `${cityName} ${specialtyName} Uzmanları`
      : `${cityName} ${short} Terapistleri`;

  const intro = `${cityName}${da} ${specialtyName} alanında çalışan psikolog ve terapistleri Terapimap üzerinden inceleyebilir, online veya yüz yüze terapi seçeneklerine göre filtreleyebilirsiniz.`;

  const sections: LandingSection[] = [
    {
      heading: `${cityName}${da} ${short} Desteği Alabileceğiniz Uzmanlar`,
      paragraphs: [
        total > 0
          ? `Terapimap'te şu anda ${cityName}${da} ${specialtyLower} alanında çalışan ${total} uzman listeleniyor${onlineCount > 0 ? ` ve bunların ${onlineCount} tanesi online görüşme seçeneği sunuyor` : ''}. Profillerde uzmanların eğitim bilgileri, deneyimleri, çalıştıkları alanlar ve iletişim seçenekleri yer alır. Dilerseniz ilçeye, görüşme türüne veya uzman tipine göre filtreleyerek aramanızı daraltabilirsiniz.`
          : `${cityName}${da} bu alanda kayıtlı uzman sayısı henüz sınırlı. Online çalışan uzmanları inceleyebilir veya yakın uzmanlık alanlarına göz atabilirsiniz; yeni uzmanlar eklendikçe bu sayfa güncellenir.`,
      ],
    },
    {
      heading: `${specialtyName} Nedir?`,
      paragraphs: [info.whatIs, info.suitableFor],
    },
    {
      heading: `Online ${short} Mümkün mü?`,
      paragraphs: [
        `Birçok uzman, görüntülü görüşme yoluyla online terapi seçeneği sunmaktadır. Online terapi; ulaşım, zaman veya konum kısıtı olanlar için pratik bir alternatif olabilir. Yüz yüze görüşme ise bazı kişiler ve bazı çalışma biçimleri için daha uygun hissedilebilir. Hangi formatın size uygun olduğunu ilk görüşmede uzmanla birlikte değerlendirebilirsiniz.`,
      ],
    },
    {
      heading: 'Terapist Seçerken Nelere Dikkat Etmelisiniz?',
      paragraphs: [
        `Uzmanın eğitimi ve unvanı (psikolog, klinik psikolog, psikiyatrist, psikolojik danışman), çalıştığı alanlar ve deneyimi ilk bakılacak noktalar arasındadır. Bunun yanında görüşme ücreti, seans formatı ve uzmanla kurduğunuz iletişimin size iyi hissettirip hissettirmediği de önemlidir. Terapi süreci kişiye göre değişebilir; ilk seanslar hem uzmanı tanımak hem de birlikte çalışıp çalışamayacağınızı değerlendirmek için bir fırsattır.`,
        `Terapimap bir sağlık hizmeti sağlayıcısı değildir; uzman profillerini bir araya getiren bir platformdur. Profildeki bilgileri inceleyip iletişim formu üzerinden dilediğiniz uzmana ulaşabilirsiniz.`,
      ],
    },
    {
      heading: `${cityName}${da} Terapi`,
      paragraphs: [
        `${cityName}${daki} uzmanlar farklı ilçelerde ve farklı çalışma modelleriyle hizmet vermektedir. Konumunuza yakın bir uzman arıyorsanız ilçe filtresini kullanabilir, esneklik istiyorsanız online görüşme sunan uzmanları öne alabilirsiniz. Uygun uzmanı bulduğunuzda profil sayfasındaki form üzerinden kendisine doğrudan ulaşabilirsiniz.`,
      ],
    },
  ];

  const faqs: LandingFaq[] = [
    {
      q: `${short} nedir?`,
      a: info.whatIs,
    },
    {
      q: `${short} kimler için uygundur?`,
      a: info.suitableFor,
    },
    {
      q: `${cityName}${da} ${specialtyLower} terapisti nasıl seçilir?`,
      a: `Uzmanın eğitim ve deneyim bilgilerini, çalıştığı alanları ve görüşme seçeneklerini profil sayfasından inceleyebilirsiniz. İlçe ve görüşme türü filtreleriyle aramanızı daraltabilir, size uygun hissettiren uzmanla ilk görüşmeyi planlayabilirsiniz.`,
    },
    {
      q: `Online ${specialtyLower} görüşmesi yapılabilir mi?`,
      a: `Evet, birçok uzman online görüşme seçeneği sunmaktadır. Listede "Online" etiketi bulunan uzmanları filtreleyerek görüntülü görüşme yapan terapistleri görebilirsiniz.`,
    },
    {
      q: 'Terapi kaç seans sürer?',
      a: `Seans sayısı; ihtiyaca, hedefe ve kullanılan yaklaşıma göre kişiden kişiye değişir. Net bir süre önceden garanti edilemez; uzmanınız ilk görüşmelerde sizinle birlikte bir plan oluşturacaktır.`,
    },
    {
      q: 'Terapi ilaç tedavisinin yerine geçer mi?',
      a: `Terapi ve ilaç tedavisi farklı destek biçimleridir ve bazı durumlarda birlikte yürütülebilir. İlaç tedavisi yalnızca psikiyatristler tarafından değerlendirilir ve düzenlenir; mevcut bir tedaviyi bırakmadan önce mutlaka hekiminize danışın.`,
    },
    {
      q: 'Terapimap üzerinden uzmanlarla nasıl iletişime geçebilirim?',
      a: `Size uygun uzmanın profil sayfasındaki iletişim formunu doldurmanız yeterli. Bilgileriniz yalnızca seçtiğiniz uzmana iletilir; uzman sizinle paylaştığınız bilgiler üzerinden iletişime geçer.`,
    },
  ];

  return {
    h1,
    metaTitle,
    metaDescription,
    intro,
    sections,
    faqs,
    isIndexable: total >= MIN_THERAPISTS_FOR_INDEX,
  };
}

/* ── Şehir (uzmanlık yok) landing içeriği ──────────────────────────── */

/**
 * Yalnızca şehir landing sayfaları için özgün içerik + SSS üretir.
 * (Uzmanlık boyutu olmadığı için şehir odaklı, genel bir şablondur.)
 */
export function buildCityLandingCopy({
  cityName,
  total,
  onlineCount,
}: {
  cityName: string;
  total: number;
  onlineCount: number;
}): LandingCopy {
  const da = getLocativeSuffix(cityName);
  const daki = getLocativeSuffix(cityName, true);

  const metaTitle = `${cityName} Terapistleri ve Psikologları | Terapimap`;
  const metaDescription = `${cityName}${da} psikolog, klinik psikolog ve psikiyatristleri inceleyin. Uzmanlık alanı ve görüşme türüne göre filtreleyin, size uygun uzmanı seçin.`;
  const h1 = `${cityName} Terapistleri`;
  const intro = `${cityName}${da} çalışan psikolog, klinik psikolog, psikiyatrist ve terapistleri Terapimap üzerinden inceleyebilir; uzmanlık alanına, ilçeye ve görüşme türüne göre filtreleyebilirsiniz.`;

  const sections: LandingSection[] = [
    {
      heading: `${cityName}${da} Terapist ve Psikolog Bulmak`,
      paragraphs: [
        total > 0
          ? `Terapimap'te şu anda ${cityName}${da} ${total} uzman listeleniyor${onlineCount > 0 ? ` ve bunların ${onlineCount} tanesi online görüşme seçeneği sunuyor` : ''}. Uzman profillerinde eğitim bilgileri, deneyim, çalışılan alanlar ve iletişim seçenekleri yer alır. İlçeye, uzmanlık alanına veya görüşme türüne göre filtreleyerek size en uygun uzmana kolayca ulaşabilirsiniz.`
          : `${cityName}${da} kayıtlı uzman sayısı henüz sınırlı. Online çalışan uzmanları inceleyebilir veya yakın şehirlerdeki uzmanlara göz atabilirsiniz; yeni uzmanlar eklendikçe bu sayfa güncellenir.`,
      ],
    },
    {
      heading: 'Terapist Seçerken Nelere Dikkat Etmelisiniz?',
      paragraphs: [
        `Uzmanın eğitimi ve unvanı (psikolog, klinik psikolog, psikiyatrist, psikolojik danışman), çalıştığı alanlar ve deneyimi ilk bakılacak noktalar arasındadır. Görüşme ücreti, seans formatı ve uzmanla kurduğunuz iletişimin size iyi hissettirip hissettirmediği de önemlidir. İlk seanslar hem uzmanı tanımak hem de birlikte çalışıp çalışamayacağınızı değerlendirmek için bir fırsattır.`,
        `Terapimap bir sağlık hizmeti sağlayıcısı değildir; uzman profillerini bir araya getiren bir platformdur. Profildeki bilgileri inceleyip iletişim formu üzerinden dilediğiniz uzmana ulaşabilirsiniz.`,
      ],
    },
    {
      heading: `${cityName}${da} Online Terapi`,
      paragraphs: [
        `${cityName}${daki} birçok uzman görüntülü görüşme yoluyla online terapi seçeneği de sunmaktadır. Online terapi; ulaşım, zaman veya konum kısıtı olanlar için pratik bir alternatif olabilir. Hangi formatın size uygun olduğunu ilk görüşmede uzmanla birlikte değerlendirebilirsiniz.`,
      ],
    },
  ];

  const faqs: LandingFaq[] = [
    {
      q: `${cityName}${da} terapist nasıl seçilir?`,
      a: `Uzmanın eğitim ve deneyim bilgilerini, çalıştığı alanları ve görüşme seçeneklerini profil sayfasından inceleyebilirsiniz. İlçe, uzmanlık alanı ve görüşme türü filtreleriyle aramanızı daraltabilir, size uygun hissettiren uzmanla ilk görüşmeyi planlayabilirsiniz.`,
    },
    {
      q: `${cityName}${da} online terapi mümkün mü?`,
      a: `Evet, birçok uzman online görüşme seçeneği sunmaktadır. Listede "Online" filtresini kullanarak görüntülü görüşme yapan terapistleri görebilirsiniz.`,
    },
    {
      q: 'Terapi kaç seans sürer?',
      a: `Seans sayısı; ihtiyaca, hedefe ve kullanılan yaklaşıma göre kişiden kişiye değişir. Net bir süre önceden garanti edilemez; uzmanınız ilk görüşmelerde sizinle birlikte bir plan oluşturacaktır.`,
    },
    {
      q: 'Terapimap üzerinden uzmanlarla nasıl iletişime geçebilirim?',
      a: `Size uygun uzmanın profil sayfasındaki iletişim formunu doldurmanız yeterli. Bilgileriniz yalnızca seçtiğiniz uzmana iletilir; uzman sizinle paylaştığınız bilgiler üzerinden iletişime geçer.`,
    },
  ];

  return { h1, metaTitle, metaDescription, intro, sections, faqs, isIndexable: total >= MIN_THERAPISTS_FOR_INDEX };
}

/* ── DB override'larıyla birleştirilmiş nihai içerik ───────────────── */

export async function getLandingCopy(params: {
  citySlug: string;
  cityName: string;
  specialtySlug: string;
  specialtyName: string;
  total: number;
  onlineCount: number;
}): Promise<LandingCopy> {
  const copy = buildTemplateCopy(params);

  // Özel içerik (migration çalıştırılmadıysa hata yutulur → şablon kullanılır)
  try {
    const supabase = getPublicClient();

    const [{ data: custom }, { data: spec }] = await Promise.all([
      supabase
        .from('seo_landing_pages')
        .select('*')
        .eq('city_slug', params.citySlug)
        .eq('specialty_slug', params.specialtySlug)
        .maybeSingle(),
      supabase
        .from('specialties')
        .select('seo_title, seo_description, seo_intro, seo_faqs, is_indexable')
        .eq('slug', params.specialtySlug)
        .maybeSingle(),
    ]);

    if (spec) {
      if (spec.seo_title) copy.metaTitle = spec.seo_title;
      if (spec.seo_description) copy.metaDescription = spec.seo_description;
      if (spec.seo_intro) copy.intro = spec.seo_intro;
      if (Array.isArray(spec.seo_faqs) && spec.seo_faqs.length > 0) {
        copy.faqs = spec.seo_faqs as LandingFaq[];
      }
      if (spec.is_indexable === false) copy.isIndexable = false;
    }

    if (custom) {
      if (custom.title) copy.metaTitle = custom.title;
      if (custom.description) copy.metaDescription = custom.description;
      if (custom.h1) copy.h1 = custom.h1;
      if (custom.intro_content) copy.intro = custom.intro_content;
      if (Array.isArray(custom.faq_json) && custom.faq_json.length > 0) {
        copy.faqs = custom.faq_json as LandingFaq[];
      }
      if (custom.is_indexable === false) copy.isIndexable = false;
    }
  } catch {
    // tablo/kolonlar yoksa şablonla devam
  }

  return copy;
}

/* ── Dahili linkler ────────────────────────────────────────────────── */

export type InternalLink = { label: string; href: string };

export function buildInternalLinks({
  locale,
  citySlug,
  cityName,
  currentSpecialtySlug,
  specialties,
}: {
  locale: string;
  citySlug: string;
  cityName: string;
  currentSpecialtySlug?: string;
  specialties: { slug: string; name: string }[];
}): InternalLink[] {
  const listBase = locale === 'tr' ? 'terapistler' : 'therapists';
  // Öncelikli popüler alanlar; listede varsa öne alınır
  const priority = ['anksiyete', 'depresyon', 'emdr', 'cift-terapisi', 'travma'];

  const sorted = [...specialties]
    .filter((s) => s.slug !== currentSpecialtySlug)
    .sort((a, b) => {
      const ai = priority.indexOf(a.slug);
      const bi = priority.indexOf(b.slug);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .slice(0, 6);

  const links: InternalLink[] = sorted.map((s) => ({
    label: `${cityName} ${s.name} Terapistleri`,
    href: `/${locale}/${listBase}/${citySlug}/${s.slug}`,
  }));

  links.push({
    label: `${cityName} Terapistleri`,
    href: `/${locale}/${listBase}/${citySlug}`,
  });
  links.push({
    label: 'Online Terapistler',
    href: `/${locale}/${listBase}?online=1`,
  });

  return links;
}

/* ── Uzmanlık → Rehber kategorisi eşlemesi ─────────────────────────── */

/**
 * Bir uzmanlık alanını ("anksiyete", "bdt", "cift-terapisi") en ilgili
 * Psikoloji Rehberi kategorisine eşler. Landing sayfasında o kategoriden
 * makaleler "Rehber içerikleri" olarak gösterilir.
 */
export function specialtyToArticleCategory(
  specialty: { slug: string; name?: string; type?: string | null },
): ArticleCategory {
  const slug = specialty.slug.toLocaleLowerCase('tr');

  // Açık slug eşleşmeleri (tip ne olursa olsun önceliklidir)
  if (/(cocuk|çocuk|ergen|genc|genç|ogrenci|öğrenci)/.test(slug)) return 'cocuk-ve-ergen';
  if (/(cift|çift|evlilik|iliski|ilişki|aile|bosanma|boşanma|gottman|eft)/.test(slug)) return 'iliskiler';

  const type = specialty.type ?? 'konu';
  if (type === 'yontem') return 'terapi-yontemleri';
  if (type === 'kitle') return 'psikolojik-konular';
  return 'psikolojik-konular';
}

/* ── Benzer şehirler ───────────────────────────────────────────────── */

/**
 * Aynı uzmanlık (varsa) için diğer şehir landing linkleri.
 * Mevcut şehir hariç, CITIES sırasıyla (kabaca nüfus/büyüklük) ilk N şehir.
 */
export function buildSimilarCityLinks({
  locale,
  currentCitySlug,
  specialtySlug,
  specialtyName,
  limit = 8,
}: {
  locale: string;
  currentCitySlug: string;
  specialtySlug?: string;
  specialtyName?: string;
  limit?: number;
}): InternalLink[] {
  const listBase = locale === 'tr' ? 'terapistler' : 'therapists';
  return CITIES.filter((c) => c.slug !== currentCitySlug)
    .slice(0, limit)
    .map((c) => ({
      label:
        specialtySlug && specialtyName
          ? `${c.name} ${specialtyName} Terapistleri`
          : `${c.name} Terapistleri`,
      href: specialtySlug
        ? `/${locale}/${listBase}/${c.slug}/${specialtySlug}`
        : `/${locale}/${listBase}/${c.slug}`,
    }));
}

/* ── Benzer uzmanlıklar (aynı şehirde) ─────────────────────────────── */

/**
 * Aynı şehirdeki diğer uzmanlık alanlarına landing linkleri.
 * Popüler alanlar öne alınır; mevcut uzmanlık hariç tutulur.
 */
export function buildSpecialtyLinks({
  locale,
  citySlug,
  cityName,
  currentSpecialtySlug,
  specialties,
  limit = 8,
}: {
  locale: string;
  citySlug: string;
  cityName: string;
  currentSpecialtySlug?: string;
  specialties: Pick<Specialty, 'slug' | 'name'>[];
  limit?: number;
}): InternalLink[] {
  const listBase = locale === 'tr' ? 'terapistler' : 'therapists';
  const priority = ['anksiyete', 'depresyon', 'emdr', 'cift-terapisi', 'travma', 'panik-atak'];

  return [...specialties]
    .filter((s) => s.slug !== currentSpecialtySlug)
    .sort((a, b) => {
      const ai = priority.indexOf(a.slug);
      const bi = priority.indexOf(b.slug);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .slice(0, limit)
    .map((s) => ({
      label: `${cityName} ${s.name} Terapistleri`,
      href: `/${locale}/${listBase}/${citySlug}/${s.slug}`,
    }));
}

/* ── Canonical yardımcıları ────────────────────────────────────────── */

export function landingCanonical(locale: string, citySlug: string, specialtySlug?: string): string {
  const listBase = locale === 'tr' ? 'terapistler' : 'therapists';
  return absUrl(
    `/${locale}/${listBase}/${citySlug}${specialtySlug ? `/${specialtySlug}` : ''}`,
  );
}
