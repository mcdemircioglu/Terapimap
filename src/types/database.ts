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
  | "family_therapist"
  | "counselor";

export const PROFESSIONAL_TYPE_LABELS: Record<ProfessionalType, string> = {
  psychologist: "Psikolog",
  clinical_psychologist: "Klinik Psikolog",
  psychiatrist: "Psikiyatrist",
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
