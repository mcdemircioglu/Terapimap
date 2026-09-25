// Hand-written DB types. If you generate types via `supabase gen types typescript`,
// drop them in here and re-export the parts the app uses.

export type SpecialtyType = 'konu' | 'yontem' | 'kitle';

/** Arayüzdeki grup başlıkları ve sıralama. */
export const SPECIALTY_TYPE_ORDER: SpecialtyType[] = ['konu', 'yontem', 'kitle'];

export const SPECIALTY_TYPE_LABELS: Record<
  SpecialtyType,
  { profile: string; filter: string; form: string; formHint: string }
> = {
  konu: {
    profile: 'Çalıştığı konular',
    filter: 'Konu',
    form: 'Çalıştığınız konular',
    formHint: 'Danışanların sizi bu başlıklarla arayacağını unutmayın',
  },
  yontem: {
    profile: 'Kullandığı yöntemler',
    filter: 'Yöntem',
    form: 'Kullandığınız yöntemler',
    formHint: 'Eğitimini aldığınız terapi ekollerini seçin',
  },
  kitle: {
    profile: 'Çalıştığı gruplar',
    filter: 'Danışan grubu',
    form: 'Çalıştığınız gruplar',
    formHint: 'Hangi yaş ve danışan gruplarıyla çalışıyorsunuz?',
  },
};

export type Specialty = {
  id: string;
  slug: string;
  name: string;
  /** Taksonomi tipi — eski kayıtlarda tanımsız olabilir, 'konu' varsayılır. */
  type?: SpecialtyType | null;
  sort_order?: number | null;
  created_at: string;
};

/** Uzmanlıkları tipe göre gruplar; tipi olmayanlar 'konu' sayılır. */
export function groupSpecialties(
  specialties: Specialty[],
): { type: SpecialtyType; items: Specialty[] }[] {
  return SPECIALTY_TYPE_ORDER.map((type) => ({
    type,
    items: specialties
      .filter((s) => (s.type ?? 'konu') === type)
      .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)),
  })).filter((group) => group.items.length > 0);
}

export type ProfessionalType =
  | "psychologist"
  | "clinical_psychologist"
  | "psychiatrist"
  | "child_psychiatrist"
  | "family_therapist"
  | "counselor";

export const PROFESSIONAL_TYPE_LABELS: Record<ProfessionalType, string> = {
  psychologist: "Psikolog",
  clinical_psychologist: "Klinik Psikolog",
  psychiatrist: "Psikiyatrist",
  child_psychiatrist: "Çocuk Psikiyatristi",
  family_therapist: "Aile Terapisti",
  counselor: "Psikolojik Danışman",
};

export type ProfessionalStatus = 'pending' | 'approved' | 'featured' | 'rejected';

export type Professional = {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  professional_type: ProfessionalType | null;
  city: string;
  district: string | null;
  clinic_name: string | null;
  address: string | null;
  is_online: boolean;
  is_in_person: boolean;
  is_featured: boolean;
  is_verified: boolean;
  status: ProfessionalStatus | null;
  experience_years: number;
  about: string | null;
  price_range: string | null;
  rating: number;
  image_url: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  google_maps_url: string | null;
  instagram_url: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfessionalWithSpecialties = Professional & {
  specialties: Specialty[];
};

export type Lead = {
  id: string;
  professional_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: string;
  source: string | null;
  created_at: string;
};

// Verification requests feature

export type VerificationRequestType = 'update' | 'photo_update' | 'removal';
export type VerificationRequestStatus = 'pending' | 'approved' | 'rejected' | 'removal_requested' | 'removed';

export type VerificationRequest = {
  id: string;
  professional_id: string | null;
  request_type: VerificationRequestType;
  full_name: string;
  email: string;
  phone: string;
  title: string | null;
  city: string | null;
  district: string | null;
  clinic_name: string | null;
  address: string | null;
  website: string | null;
  instagram: string | null;
  offers_online: boolean | null;
  offers_in_person: boolean | null;
  specialties: string[] | null;
  bio: string | null;
  photo_url: string | null;
  message: string | null;
  status: VerificationRequestStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

export type VerificationRequestWithProfessional = VerificationRequest & {
  professional: Professional | null;
};

// ---------------------------------------------------------------------
// Psikoloji Rehberi — articles
// ---------------------------------------------------------------------

export const ARTICLE_CATEGORIES = [
  'terapi-rehberi',
  'psikolojik-konular',
  'terapi-yontemleri',
  'cocuk-ve-ergen',
  'iliskiler',
  'genel-psikoloji',
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export const ARTICLE_CATEGORY_LABELS: Record<ArticleCategory, string> = {
  'terapi-rehberi': 'Terapi Rehberi',
  'psikolojik-konular': 'Psikolojik Konular',
  'terapi-yontemleri': 'Terapi Yöntemleri',
  'cocuk-ve-ergen': 'Çocuk ve Ergen',
  'iliskiler': 'İlişkiler',
  'genel-psikoloji': 'Genel Psikoloji',
};

export function isArticleCategory(value: string): value is ArticleCategory {
  return (ARTICLE_CATEGORIES as readonly string[]).includes(value);
}

export type ArticleStatus = 'draft' | 'published';

export type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  /** Markdown formatında içerik gövdesi. */
  content: string;
  category: ArticleCategory;
  cover_image_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  status: ArticleStatus;
  is_featured: boolean;
  /** İlişkili uzmanlık sayfası slug'ı (ör. 'cift-terapisi') — rehber CTA hedefini belirler. Boşsa kod içi fallback haritalarına düşülür. */
  related_specialty_slug: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Liste kartları için — content gövdesi fetch edilmez. */
export type ArticleListItem = Pick<
  Article,
  'id' | 'title' | 'slug' | 'excerpt' | 'category' | 'cover_image_url' | 'is_featured' | 'published_at'
> & {
  /** PostgREST computed column (reading_minutes fonksiyonu). */
  reading_minutes: number;
};

// ---------------------------------------------------------------------
// Psikoloji testleri
// ---------------------------------------------------------------------

export type TestKind = 'clinical' | 'viral';

/** Kategorik (viral tip) testlerde bir sorunun kendine ait seçenekleri —
 *  her seçenek ortak bir sayısal değer yerine bir sonuç kategorisine bağlanır. */
export type TestCategoryOption = {
  label_tr: string;
  /** `scoring.categories[].key` ile eşleşir. */
  category: string;
};

export type TestQuestion = {
  id: string;
  text_tr: string;
  /** Ters puanlanan madde mi? (ör. Rosenberg Özgüven Ölçeği'ndeki olumsuz ifadeler).
   *  true ise puanlama sırasında seçilen değer skalanın tepe noktasından çıkarılır
   *  (ör. 0-3'lük skalada 3 → 0, 0 → 3). Belirtilmezse normal (ters çevrilmemiş) puanlanır.
   *  Yalnızca doğrusal (scale/tiers tabanlı) testlerde anlamlıdır. */
  reverse?: boolean;
  /** Doluysa bu soru kategorik bir testin parçasıdır: ortak `scoring.scale` yerine
   *  bu seçenekler kullanılır, her biri bir `scoring.categories[].key`'e işaret eder. */
  options?: TestCategoryOption[];
};

export type TestScaleOption = {
  label_tr: string;
  value: number;
};

export type TestTier = {
  min: number;
  max: number;
  label_tr: string;
  summary_tr: string;
};

/** Kategorik (viral tip) testlerde olası sonuçlardan biri — ör. bağlanma stili. */
export type TestCategory = {
  /** Sorulardaki `options[].category` alanıyla eşleşen benzersiz anahtar. */
  key: string;
  label_tr: string;
  summary_tr: string;
};

/**
 * İki test tipini destekler:
 *  - Doğrusal (klinik tarama tarzı, ör. GAD-7/PHQ-8): `scale` + `max_score` + `tiers`
 *    dolu, `categories` boş. Puan toplanır, `tiers` aralığına göre kademe bulunur.
 *  - Kategorik (viral tip, ör. Bağlanma Stili Testi): `categories` dolu, `scale`/
 *    `tiers` boş. Her soru kendi `options`'ını taşır; en çok seçilen kategori kazanır.
 */
export type TestScoring = {
  scale?: TestScaleOption[];
  max_score?: number;
  tiers?: TestTier[];
  categories?: TestCategory[];
};

/** `specialties` tablosundan embed edilen daraltılmış alanlar (CTA/internal linking için). */
export type TestSpecialtyRef = {
  slug: string;
  /** `specialties` tablosunda tek dilli (TR) tek bir `name` kolonu var — name_tr/name_en yok. */
  name: string;
};

export type PsychologyTest = {
  id: string;
  slug: string;
  title_tr: string;
  title_en: string | null;
  intro_tr: string | null;
  kind: TestKind;
  source_label: string | null;
  /** Hub kartında gösterilecek kapak görseli. Boşsa kart ikon+pastel fallback'e düşer;
   *  ileride yalnızca bu alanı güncelleyerek (kod değişikliği/deploy gerekmeden) kapakları yenileyebiliriz. */
  cover_image_url: string | null;
  specialty_id: string | null;
  /** `getTestBySlug`/`getPublishedTests` sorgularında `specialties(slug, name)` embed edilir. */
  specialty?: TestSpecialtyRef | null;
  questions: TestQuestion[];
  scoring: TestScoring;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

/** Hub/liste görünümü için — questions/scoring gövdesi fetch edilmez. */
export type PsychologyTestListItem = Pick<
  PsychologyTest,
  'id' | 'slug' | 'title_tr' | 'title_en' | 'intro_tr' | 'kind' | 'source_label' | 'cover_image_url' | 'specialty'
>;

/** Yalnızca doğrusal (tiers tabanlı) testlerde kullanılır. */
export function scoreTier(scoring: TestScoring, score: number): TestTier | null {
  return (scoring.tiers ?? []).find((t) => score >= t.min && score <= t.max) ?? null;
}
