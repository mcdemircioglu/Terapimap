import { unstable_cache } from 'next/cache';
import { getPublicClient } from './supabase/server';
import { getCityName, getCitySlug } from './cities';
import type {
  Professional,
  ProfessionalType,
  ProfessionalWithSpecialties,
  Specialty,
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
  { revalidate: 600, tags: ['therapists-list'] },
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

  query = query.order('rating', { ascending: false });
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
    return (b.rating ?? 0) - (a.rating ?? 0);
  });

    return rows;
  },
  ['getTherapists'],
  { revalidate: 600, tags: ['therapists-list'] },
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
 */
export const getTherapistsPaged = unstable_cache(
  async (
    filters: TherapistPagedFilters = {},
  ): Promise<{ therapists: ProfessionalWithSpecialties[]; total: number }> => {
  const supabase = getPublicClient();
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

  let query = supabase
    .from('professionals')
    .select(PROFESSIONAL_LIST_SELECT, { count: 'exact' })
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
  query = query.order('rating', { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    logError('getTherapistsPaged', error);
    return { therapists: [], total: 0 };
  }

  const therapists = (data ?? []).map((row: any) => ({
    ...(row as Professional),
    specialties: flattenSpecialties(row),
  })) as ProfessionalWithSpecialties[];

    return { therapists, total: count ?? 0 };
  },
  ['getTherapistsPaged'],
  { revalidate: 600, tags: ['therapists-list'] },
);

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
  { revalidate: 600, tags: ['therapists-list'] },
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
}) {
  const supabase = getPublicClient();
  const { error } = await supabase.from('leads').insert({
    professional_id: input.professional_id,
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    message: input.message,
  });

  if (error) {
    logError('createLead', error);
    throw error;
  }
}
