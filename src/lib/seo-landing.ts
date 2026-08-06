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

/* ── Uzmanlık kısaltması: "Bilişsel Davranışçı Terapi (BDT)" → "BDT" ── */
export function shortSpecialtyName(name: string): string {
  const m = name.match(/\(([^)]+)\)/);
  return m ? m[1] : name;
}

/* ── Bilinen uzmanlıklar için özel "nedir" içeriği ─────────────────── */
type SpecialtyInfo = { whatIs: string; suitableFor: string };

const SPECIALTY_INFO: { keywords: string[]; info: SpecialtyInfo }[] = [
  {
    keywords: ['bdt', 'bilişsel'],
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
    keywords: ['depresyon'],
    info: {
      whatIs:
        'Depresyon; süregelen isteksizlik, enerji düşüklüğü, uyku ve iştah değişiklikleri ile kendini gösterebilen yaygın bir ruh sağlığı durumudur. Terapi sürecinde duyguları anlamak, günlük işlevselliği desteklemek ve kişiye uygun baş etme yolları geliştirmek hedeflenir.',
      suitableFor:
        'Uzun süredir keyif alamama, umutsuzluk, odaklanma güçlüğü veya sosyal geri çekilme yaşayanlar bir uzmanla görüşmeyi değerlendirebilir. Belirtiler yoğunsa psikiyatrist değerlendirmesi de sürece eşlik edebilir.',
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
    keywords: ['travma'],
    info: {
      whatIs:
        'Travma alanında çalışan uzmanlar; kaza, kayıp, doğal afet, ihmal veya istismar gibi zorlayıcı yaşantıların ardından ortaya çıkabilen belirtilerle çalışır. Terapide güvenlik duygusunu yeniden kurmak ve yaşantıyı işlemek ön plandadır.',
      suitableFor:
        'Zorlayıcı bir olayın ardından kâbuslar, aşırı tetikte olma, kaçınma veya duygusal küntlük yaşayanlar travma alanında deneyimli bir uzmanla görüşmeyi değerlendirebilir.',
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
    isIndexable: total > 0,
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

  return { h1, metaTitle, metaDescription, intro, sections, faqs, isIndexable: total > 0 };
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
