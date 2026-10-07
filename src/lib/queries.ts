import { unstable_cache } from 'next/cache';
import { getPublicClient, getServiceClient } from './supabase/server';
import { getCityName, getCitySlug } from './cities';
import type {
  Professional,
  ProfessionalType,
  ProfessionalWithSpecialties,
  Specialty,
  PsychologyTest,
  PsychologyTestListItem,
  PublicReview,
} from '@/types/database';

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

function logError(fn: string, error: unknown) {
  console.error(`\n[terapimap:queries] ${fn} failed:`);
  console.error(JSON.stringify(error, null, 2));
}

function flattenSpecialties(row: any): Specialty[] {
  const join: any[] = row.professional_specialties ?? row.specialties ?? [];
  return join
    .map((ps: any) => ps.specialties ?? ps.specialty ?? null)
    .filter(Boolean) as Specialty[];
}

const PROFESSIONAL_SELECT = `
  *,
  professional_specialties (
    specialties ( * )
  )
`;

/**
 * Liste/kart görünümleri (grid, SEO landing, sayfalı liste) için daraltılmış
 * kolon seti — Supabase egress'ini düşürür. Kartta (TherapistCard),
 * buildItemListSchema'da ve sitemap.xml'de kullanılan alanların hepsini
 * kapsar. Tekil profil sayfası (getTherapistBySlug) hâlâ tam satırı
 * (PROFESSIONAL_SELECT) çeker; about/adres/iletişim gibi alanlar yalnızca
 * orada gerekir.
 */
const PROFESSIONAL_LIST_SELECT = `
  id, slug, name, title, professional_type, city, district,
  is_online, is_in_person, is_verified, is_featured, featured_until,
  experience_years, price_range, rating, image_url, updated_at,
  professional_specialties (
    specialties ( id, name, slug, type, sort_order )
  )
`;

/**
 * Öne çıkarma süreye bağlı: is_featured true olsa da featured_until geçmişse
 * artık "öne çıkan" sayılmaz. featured_until NULL = süresiz (kalıcı).
 * Cron gerektirmeden okuma anında değerlendirilir.
 */
function isEffectivelyFeatured(row: {
  is_featured?: boolean | null;
  featured_until?: string | null;
}): boolean {
  if (!row?.is_featured) return false;
  if (!row.featured_until) return true;
  return new Date(row.featured_until).getTime() > Date.now();
}

// ---------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------

export type TherapistFilters = {
  citySlug?: string;
  specialtySlug?: string;
  district?: string;
  professionalType?: ProfessionalType;
  online?: boolean;
  inPerson?: boolean;
  search?: string;
  limit?: number;
};

// ---------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------

export const getSpecialties = unstable_cache(
  async (): Promise<Specialty[]> => {
    const supabase = getPublicClient();
    const { data, error } = await supabase
      .from('specialties')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      logError('getSpecialties', error);
      return [];
    }
    return (data ?? []) as Specialty[];
  },
  ['getSpecialties'],
  { revalidate: 3600, tags: ['specialties'] },
);

/**
 * Ana sayfa istatistikleri — hafif sayımlar (embed yok).
 * Görünür/onaylı uzman sayısı ve kaç farklı ilde uzman olduğu.
 */
export async function getHomeStats(): Promise<{
  totalTherapists: number;
  cityCount: number;
}> {
  const supabase = getPublicClient();
  const { data, error, count } = await supabase
    .from('professionals')
    .select('city', { count: 'exact' })
    .in('status', ['approved', 'featured'])
    .eq('is_visible', true)
    .is('removed_at', null);

  if (error) {
    logError('getHomeStats', error);
    return { totalTherapists: 0, cityCount: 0 };
  }

  const cities = new Set((data ?? []).map((r: any) => r.city).filter(Boolean));
  return { totalTherapists: count ?? 0, cityCount: cities.size };
}

/**
 * İlçe listesi — filtre sayfalarında (searchParams okuduğu için dinamik
 * render edilen /therapists rotalarında) her istekte çağrılır; egress'i
 * önlemek için önbelleklenir.
 */
export const getDistricts = unstable_cache(
  async (citySlug?: string): Promise<string[]> => {
    const supabase = getPublicClient();
    let query = supabase
      .from('professionals')
      .select('district')
      .in('status', ['approved', 'featured'])
      .eq('is_visible', true)
      .is('removed_at', null);
    if (citySlug) {
      const cityName = getCityName(citySlug);
      if (cityName) query = query.eq('city', cityName);
    }
    const { data, error } = await query;
    if (error) {
      logError('getDistricts', error);
      return [];
    }
    const unique = Array.from(
      new Set(
        (data ?? [])
          .map((r: any) => r.district as string | null)
          .filter((d): d is string => typeof d === 'string' && d.trim() !== ''),
      ),
    ).sort((a, b) => a.localeCompare(b));
    return unique;
  },
  ['getDistricts'],
  { revalidate: 21600, tags: ['therapists-list'] },
);

export const getTherapists = unstable_cache(
  async (
    filters: TherapistFilters = {},
  ): Promise<ProfessionalWithSpecialties[]> => {
  const supabase = getPublicClient();

  let query = supabase
    .from('professionals')
    .select(PROFESSIONAL_LIST_SELECT)
    .in('status', ['approved', 'featured'])
    .eq('is_visible', true)
    .is('removed_at', null);

  if (filters.citySlug) {
    const cityName = getCityName(filters.citySlug);
    if (cityName) query = query.eq('city', cityName);
  }
  if (filters.district) query = query.eq('district', filters.district);
  if (filters.professionalType) query = query.eq('professional_type', filters.professionalType);
  if (filters.online === true) query = query.eq('is_online', true);
  if (filters.inPerson === true) query = query.eq('is_in_person', true);
  if (filters.search) {
    // İsimle arama (terapist adı). Virgül/yüzde gibi PostgREST'i bozabilecek
    // karakterleri temizle; ilike ile kısmi eşleşme yap.
    const clean = filters.search.replace(/[%,()]/g, ' ').trim();
    if (clean) query = query.ilike('name', `%${clean}%`);
  }

  query = query
    .order('rating', { ascending: false, nullsFirst: false })
    .order('name', { ascending: true });
  if (filters.limit) query = query.limit(filters.limit);

  const { data, error } = await query;

  if (error) {
    logError('getTherapists', error);
    return [];
  }

  console.log(
    `[terapimap:queries] getTherapists(${JSON.stringify(filters)}) -> ${data?.length ?? 0} rows`,
  );

  let rows = (data ?? []).map((row: any) => ({
    ...(row as Professional),
    // Süresi geçen öne çıkarmalar rozet/sıralama için düşürülür.
    is_featured: isEffectivelyFeatured(row),
    specialties: flattenSpecialties(row),
  })) as ProfessionalWithSpecialties[];

  if (filters.specialtySlug) {
    rows = rows.filter((r) =>
      r.specialties.some((s) => s.slug === filters.specialtySlug),
    );
  }

  // Öne çıkanlar üstte, sonra puana göre (DB zaten rating'e göre sıraladı).
  rows.sort((a, b) => {
    const fa = a.is_featured ? 1 : 0;
    const fb = b.is_featured ? 1 : 0;
    if (fb !== fa) return fb - fa;
    const dr = (b.rating ?? 0) - (a.rating ?? 0);
    if (dr !== 0) return dr;
    return (a.name ?? '').localeCompare(b.name ?? '', 'tr');
  });

    return rows;
  },
  ['getTherapists'],
  { revalidate: 21600, tags: ['therapists-list'] },
);

export async function getFeaturedTherapists(
  count = 6,
): Promise<ProfessionalWithSpecialties[]> {
  const supabase = getPublicClient();

  const { data, error } = await supabase
    .from('professionals')
    .select(PROFESSIONAL_LIST_SELECT)
    .in('status', ['approved', 'featured'])
    .eq('is_visible', true)
    .is('removed_at', null)
    .eq('is_featured', true)
    // Süresi geçmemiş (veya süresiz) öne çıkarmalar.
    .or(`featured_until.is.null,featured_until.gt.${new Date().toISOString()}`)
    .order('rating', { ascending: false })
    .limit(count);

  if (error) {
    logError('getFeaturedTherapists', error);
    return [];
  }

  console.log(
    `[terapimap:queries] getFeaturedTherapists -> ${data?.length ?? 0} rows`,
  );
  return (data ?? []).map((row: any) => ({
    ...(row as Professional),
    specialties: flattenSpecialties(row),
  })) as ProfessionalWithSpecialties[];
}

export async function getTherapistBySlug(
  slug: string,
): Promise<ProfessionalWithSpecialties | null> {
  const supabase = getPublicClient();
  const { data, error } = await supabase
    .from('professionals')
    .select(PROFESSIONAL_SELECT)
    .eq('slug', slug)
    .in('status', ['approved', 'featured'])
    .eq('is_visible', true)
    .is('removed_at', null)
    .maybeSingle();

  if (error) {
    logError('getTherapistBySlug', error);
    return null;
  }
  if (!data) {
    console.warn(`[terapimap:queries] getTherapistBySlug("${slug}") -> not found`);
    return null;
  }

  console.log(`[terapimap:queries] getTherapistBySlug("${slug}") -> found`);
  return {
    ...(data as Professional),
    specialties: flattenSpecialties(data),
  };
}

export async function getSpecialtyBySlug(slug: string): Promise<Specialty | null> {
  const supabase = getPublicClient();
  const { data, error } = await supabase
    .from('specialties')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) { logError('getSpecialtyBySlug', error); return null; }
  return data ?? null;
}

// ---------------------------------------------------------------------
// Psikoloji testleri
// ---------------------------------------------------------------------

const TEST_SELECT = `
  *,
  specialty:specialties ( slug, name )
`;

/** Test tanımının `specialties` embed'i Supabase'de `specialty_id` FK'sına göre otomatik çözülür. */
export async function getTestBySlug(slug: string): Promise<PsychologyTest | null> {
  const supabase = getPublicClient();
  const { data, error } = await supabase
    .from('psychology_tests')
    .select(TEST_SELECT)
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();
  if (error) { logError('getTestBySlug', error); return null; }
  return (data as unknown as PsychologyTest) ?? null;
}

export async function getPublishedTests(): Promise<PsychologyTestListItem[]> {
  const supabase = getPublicClient();
  const { data, error } = await supabase
    .from('psychology_tests')
    .select('id, slug, title_tr, title_en, intro_tr, kind, source_label, cover_image_url, specialty:specialties ( slug, name )')
    .eq('is_published', true)
    .order('created_at', { ascending: true });
  if (error) { logError('getPublishedTests', error); return []; }
  return (data as unknown as PsychologyTestListItem[]) ?? [];
}

export async function getKnownTestSlugs(): Promise<string[]> {
  const supabase = getPublicClient();
  const { data, error } = await supabase
    .from('psychology_tests')
    .select('slug')
    .eq('is_published', true);
  if (error) { logError('getKnownTestSlugs', error); return []; }
  return (data ?? []).map((row: any) => row.slug as string);
}

export async function getCityCounts(): Promise<Record<string, number>> {
  const supabase = getPublicClient();
  const { data, error } = await supabase
    .from('professionals')
    .select('city')
    .in('status', ['approved', 'featured'])
    .eq('is_visible', true)
    .is('removed_at', null);

  if (error) {
    logError('getCityCounts', error);
    return {};
  }
  return (data ?? []).reduce<Record<string, number>>((acc, row: any) => {
    const slug = getCitySlug(row.city) ?? row.city?.toLowerCase() ?? 'unknown';
    acc[slug] = (acc[slug] ?? 0) + 1;
    return acc;
  }, {});
}


export type TherapistPagedFilters = TherapistFilters & {
  page?: number;
  pageSize?: number;
};

/**
 * searchParams okuyan /therapists rotaları her istekte dinamik render
 * edildiği için (Next.js App Router bunu ISR dışına çıkarır) bu fonksiyon
 * önbelleklenmezse her sayfa görüntülemesi Supabase'e canlı sorgu atar.
 * unstable_cache burada Next'in veri önbelleğini devreye sokup aynı
 * filtre/sayfa kombinasyonu için tekrar eden istekleri karşılar.
 *
 * Şehir/genel filtre yolu DB'de range() ile sayfalanıyor (sayfa başına 12
 * satır — küçük, önbelleğe güvenle sığan payload), bu yüzden kendi
 * unstable_cache'i altında kalıyor (bkz. getTherapistsPagedByCity).
 */
const getTherapistsPagedByCity = unstable_cache(
  async (
    filters: TherapistPagedFilters = {},
  ): Promise<{ therapists: ProfessionalWithSpecialties[]; total: number }> => {
  const supabase = getPublicClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const nowIso = new Date().toISOString();

  // Süresi geçmemiş (veya süresiz) öne çıkarma — getFeaturedTherapists ile aynı kural.
  const activeFeaturedOr = `featured_until.is.null,featured_until.gt.${nowIso}`;
  // Öne çıkan OLMAYANLAR: hiç öne çıkmamış ya da süresi dolmuş olanlar.
  const notFeaturedOr = `is_featured.is.null,is_featured.eq.false,featured_until.lte.${nowIso}`;

  // Ortak filtreler + sıralama (puan, eşitlikte ada göre: sıra her istekte aynı kalır).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const base = (cols: string, opts?: { count: 'exact'; head?: boolean }): any => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = supabase.from('professionals').select(cols, opts);
    query = query
      .in('status', ['approved', 'featured'])
      .eq('is_visible', true)
      .is('removed_at', null);
    if (filters.citySlug) {
      const cityName = getCityName(filters.citySlug);
      if (cityName) query = query.eq('city', cityName);
    }
    if (filters.district) query = query.eq('district', filters.district);
    if (filters.professionalType) query = query.eq('professional_type', filters.professionalType);
    if (filters.online === true) query = query.eq('is_online', true);
    if (filters.inPerson === true) query = query.eq('is_in_person', true);
    if (filters.search) {
      // İsimle arama (terapist adı). Virgül/yüzde gibi PostgREST'i bozabilecek
      // karakterleri temizle; ilike ile kısmi eşleşme yap.
      const clean = filters.search.replace(/[%,()]/g, ' ').trim();
      if (clean) query = query.ilike('name', `%${clean}%`);
    }
    return query;
  };
  const featuredQ = (q: any) => q.eq('is_featured', true).or(activeFeaturedOr);
  const restQ = (q: any) => q.or(notFeaturedOr);
  const ordered = (q: any) =>
    q.order('rating', { ascending: false, nullsFirst: false }).order('name', { ascending: true });

  // 1) Önce iki grubun sayısı (hafif, "head" sorgusu). Aralık dışı sayfa isteğinde
  //    PostgREST hata verdiği için dilimleri sayıya bakarak çekiyoruz.
  const [fCountRes, rCountRes] = await Promise.all([
    featuredQ(base('id', { count: 'exact', head: true })),
    restQ(base('id', { count: 'exact', head: true })),
  ]);
  if (fCountRes.error || rCountRes.error) {
    logError('getTherapistsPaged', fCountRes.error ?? rCountRes.error);
    return { therapists: [], total: 0 };
  }
  const featuredTotal: number = fCountRes.count ?? 0;
  const restTotal: number = rCountRes.count ?? 0;

  // 2) Sayfa dilimi: önce öne çıkanlar, sonra diğerleri. İki grup arasında sayfa
  //    geçişi (ör. 5 öne çıkan + 7 diğer) doğru çalışır.
  const featuredFrom = from;
  const featuredTo = Math.min(to, featuredTotal - 1);
  const featuredCount = featuredFrom <= featuredTo ? featuredTo - featuredFrom + 1 : 0;

  const restFrom = Math.max(0, from - featuredTotal);
  const restNeeded = pageSize - featuredCount;
  const restTo = restFrom + restNeeded - 1;

  const [fRes, rRes] = await Promise.all([
    featuredCount > 0
      ? ordered(featuredQ(base(PROFESSIONAL_LIST_SELECT))).range(featuredFrom, featuredTo)
      : Promise.resolve({ data: [], error: null }),
    restNeeded > 0 && restFrom < restTotal
      ? ordered(restQ(base(PROFESSIONAL_LIST_SELECT))).range(restFrom, restTo)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (fRes.error || rRes.error) {
    logError('getTherapistsPaged', fRes.error ?? rRes.error);
    return { therapists: [], total: 0 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRow = (row: any, featured: boolean) => ({
    ...(row as Professional),
    is_featured: featured,
    specialties: flattenSpecialties(row),
  }) as ProfessionalWithSpecialties;

  const therapists = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...((fRes.data ?? []) as any[]).map((r) => mapRow(r, true)),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...((rRes.data ?? []) as any[]).map((r) => mapRow(r, false)),
  ];

  return { therapists, total: featuredTotal + restTotal };
  },
  ['getTherapistsPaged'],
  { revalidate: 21600, tags: ['therapists-list'] },
);

/**
 * SEO/PERF fix (Eylül 2026): uzmanlık filtresi olan istekler artık ayrı,
 * unstable_cache'SİZ bir yoldan geçiyor. getTherapists() zaten kendi
 * unstable_cache'ine sahip (['getTherapists'] anahtarıyla) — bu fonksiyonu
 * da aynı (bazen 800+ satırlık, ~4MB'lık) sonucu AYRICA önbelleklemeye
 * çalışmak, Next.js Data Cache'in girdi başına 2MB sınırını aşıp
 * "Failed to set Next.js data cache, items over 2MB can not be cached"
 * hatasına yol açıyordu. Fonksiyonel bir kırılma değildi (Next önbellek
 * yazımı başarısız olunca veriyi önbelleksiz döndürür) ama popüler
 * uzmanlıklarda (Anksiyete, Depresyon vb.) her istekte tekrar eden,
 * önbelleklenmeyen ~4MB'lık Supabase sorgusu demekti — gereksiz gecikme
 * ve gereksiz Supabase egress kullanımı. getTherapists()'in kendi cache'i
 * zaten aynı işi (6 saatlik revalidate + admin işlemlerinde anında etiket temizliği ile) karşılıyor; burada ikinci
 * bir (ve başarısız olan) önbellekleme katmanına gerek yok.
 */
export async function getTherapistsPaged(
  filters: TherapistPagedFilters = {},
): Promise<{ therapists: ProfessionalWithSpecialties[]; total: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // ── Uzmanlık filtresi ──────────────────────────────────────────────
  // getTherapists() specialty'yi embed veri üzerinden süzer ve KANITLI
  // biçimde çalışır (SEO landing sayfaları onu kullanıyor). Paged sürümde
  // count:'exact' + embed + range'siz sorgu Supabase'de timeout'a düşüp
  // sessizce boş dönüyordu; bu yüzden uzmanlık filtresinde getTherapists'e
  // devredip sayfalamayı JS tarafında yapıyoruz.
  if (filters.specialtySlug) {
    const all = await getTherapists({
      citySlug: filters.citySlug,
      specialtySlug: filters.specialtySlug,
      district: filters.district,
      professionalType: filters.professionalType,
      online: filters.online,
      inPerson: filters.inPerson,
      search: filters.search,
    });
    return { therapists: all.slice(from, to + 1), total: all.length };
  }

  return getTherapistsPagedByCity(filters);
}

// ---------------------------------------------------------------------
// SEO landing istatistikleri — hafif sayım (yalnızca 3 kolon çeker)
// ---------------------------------------------------------------------

export const getTherapistStats = unstable_cache(
  async (filters: {
    citySlug?: string;
    specialtySlug?: string;
  }): Promise<{ total: number; online: number; inPerson: number }> => {
  // Uzmanlık filtresinde getTherapists'e devret (kanıtlı çalışan yol);
  // aksi hâlde hafif 3 kolonla say.
  if (filters.specialtySlug) {
    const rows = await getTherapists({
      citySlug: filters.citySlug,
      specialtySlug: filters.specialtySlug,
    });
    return {
      total: rows.length,
      online: rows.filter((r) => r.is_online).length,
      inPerson: rows.filter((r) => r.is_in_person).length,
    };
  }

  const supabase = getPublicClient();
  let query = supabase
    .from('professionals')
    .select('id, is_online, is_in_person')
    .in('status', ['approved', 'featured'])
    .eq('is_visible', true)
    .is('removed_at', null);

  if (filters.citySlug) {
    const cityName = getCityName(filters.citySlug);
    if (cityName) query = query.eq('city', cityName);
  }

  const { data, error } = await query;
  if (error) {
    logError('getTherapistStats', error);
    return { total: 0, online: 0, inPerson: 0 };
  }

  const rows = data ?? [];
    return {
      total: rows.length,
      online: rows.filter((r: any) => r.is_online).length,
      inPerson: rows.filter((r: any) => r.is_in_person).length,
    };
  },
  ['getTherapistStats'],
  { revalidate: 21600, tags: ['therapists-list'] },
);

// ---------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------

export async function createLead(input: {
  professional_id: string;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  source?: string | null;
}) {
  const supabase = getPublicClient();
  const { error } = await supabase.from('leads').insert({
    professional_id: input.professional_id,
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    message: input.message,
    ...(input.source ? { source: input.source } : {}),
  });

  if (error) {
    logError('createLead', error);
    throw error;
  }
}

export async function createTestSubmission(input: {
  test_id: string;
  score: number;
  tier_label: string;
  email?: string | null;
  consent_marketing?: boolean;
  city_slug?: string | null;
}) {
  const supabase = getPublicClient();
  const { error } = await supabase.from('test_submissions').insert({
    test_id: input.test_id,
    score: input.score,
    tier_label: input.tier_label,
    email: input.email ?? null,
    consent_marketing: input.consent_marketing ?? false,
    city_slug: input.city_slug ?? null,
  });

  if (error) {
    logError('createTestSubmission', error);
    throw error;
  }
}

// ---------------------------------------------------------------------
// Reviews (native danışan değerlendirme sistemi)
// ---------------------------------------------------------------------

/**
 * Herkese gösterilecek isim: anonimse "Anonim", değilse "Ad S." biçiminde
 * maskelenir (soyadın tam hali hiçbir zaman public tarafa sızmaz).
 */
function maskReviewerName(name: string, isAnonymous: boolean): string {
  if (isAnonymous) return 'Anonim';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Anonim';
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0);
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

export async function getApprovedReviewsForProfessional(
  professionalId: string,
): Promise<{ reviews: PublicReview[]; average: number | null; count: number }> {
  const supabase = getPublicClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('id, reviewer_name, is_anonymous, rating, comment, is_verified, created_at')
    .eq('professional_id', professionalId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) {
    logError('getApprovedReviewsForProfessional', error);
    return { reviews: [], average: null, count: 0 };
  }

  const rows = data ?? [];
  const reviews: PublicReview[] = rows.map((row) => ({
    id: row.id,
    displayName: maskReviewerName(row.reviewer_name, row.is_anonymous),
    rating: row.rating,
    comment: row.comment,
    is_verified: row.is_verified,
    created_at: row.created_at,
  }));

  const count = reviews.length;
  const average =
    count > 0 ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10 : null;

  return { reviews, average, count };
}

export async function createReview(input: {
  professional_id: string;
  reviewer_name: string;
  reviewer_email: string;
  is_anonymous: boolean;
  rating: number;
  comment: string;
  is_verified: boolean;
}) {
  // Doğrulanmış danışan (is_verified=true) satırları RLS'in genel anon
  // insert politikasıyla yazılamaz (bkz. reviews_migration.sql — bilerek
  // kısıtlı: is_verified=false şartı). Asıl yazma, randevu eşleşmesini
  // zaten kontrol etmiş /api/reviews route'undan geldiği için burada
  // service-role kullanıyoruz (therapist_verification_requests ile aynı
  // desen — bkz. src/app/api/verification-requests/route.ts).
  const supabase = getServiceClient();
  const { error } = await supabase.from('reviews').insert({
    professional_id: input.professional_id,
    reviewer_name: input.reviewer_name,
    reviewer_email: input.reviewer_email,
    is_anonymous: input.is_anonymous,
    rating: input.rating,
    comment: input.comment,
    is_verified: input.is_verified,
    status: 'pending',
  });

  if (error) {
    logError('createReview', error);
    throw error;
  }
}
