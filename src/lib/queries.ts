import { getServerClient } from './supabase/server';
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

export type TherapistPagedFilters = Omit<TherapistFilters, 'limit'> & {
  page?: number;
  pageSize?: number;
};

// ---------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------

export async function getSpecialties(): Promise<Specialty[]> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from('specialties')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    logError('getSpecialties', error);
    return [];
  }
  console.log(`[terapimap:queries] getSpecialties -> ${data?.length ?? 0} rows`);
  return data ?? [];
}

/**
 * Returns distinct, sorted district values for a given city (or all cities).
 * Used to populate the district filter dropdown.
 */
export async function getDistricts(citySlug?: string): Promise<string[]> {
  const supabase = getServerClient();
  let query = supabase.from('professionals').select('district').in('status', ['approved', 'featured']);
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
}

export async function getTherapists(
  filters: TherapistFilters = {},
): Promise<ProfessionalWithSpecialties[]> {
  const supabase = getServerClient();

  let query = supabase
    .from('professionals')
    .select(PROFESSIONAL_SELECT)
    .in('status', ['approved', 'featured']);

  // Map city slug -> city name for the Supabase filter (DB has `city`, not `city_slug`)
  if (filters.citySlug) {
    const cityName = getCityName(filters.citySlug);
    if (cityName) query = query.eq('city', cityName);
  }
  if (filters.district) query = query.eq('district', filters.district);
  if (filters.professionalType) query = query.eq('professional_type', filters.professionalType);
  if (filters.online === true) query = query.eq('is_online', true);
  if (filters.inPerson === true) query = query.eq('is_in_person', true);
  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(`name.ilike.${term},about.ilike.${term}`);
  }

  query = query.order('created_at', { ascending: false });
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
    specialties: flattenSpecialties(row),
  })) as ProfessionalWithSpecialties[];

  if (filters.specialtySlug) {
    rows = rows.filter((r) =>
      r.specialties.some((s) => s.slug === filters.specialtySlug),
    );
  }

  return rows;
}

export async function getFeaturedTherapists(
  count = 6,
): Promise<ProfessionalWithSpecialties[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('professionals')
    .select(PROFESSIONAL_SELECT)
    .in('status', ['approved', 'featured'])
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
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
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from('professionals')
    .select(PROFESSIONAL_SELECT)
    .eq('slug', slug)
    .in('status', ['approved', 'featured'])
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

export async function getTherapistsPaged(
  filters: TherapistPagedFilters = {},
): Promise<{ therapists: ProfessionalWithSpecialties[]; total: number }> {
  const supabase = getServerClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 12;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Specialty slug → professional IDs (iki adımlı: Supabase JS client subquery desteklemiyor)
  let specialtyProfIds: string[] | null = null;
  if (filters.specialtySlug) {
    const { data: specData } = await supabase
      .from('specialties')
      .select('id')
      .eq('slug', filters.specialtySlug)
      .maybeSingle();

    if (specData) {
      const { data: psData } = await supabase
        .from('professional_specialties')
        .select('professional_id')
        .eq('specialty_id', specData.id);
      specialtyProfIds = (psData ?? []).map((r: any) => r.professional_id);
    } else {
      specialtyProfIds = [];
    }
  }

  if (specialtyProfIds !== null && specialtyProfIds.length === 0) {
    return { therapists: [], total: 0 };
  }

  let query = supabase
    .from('professionals')
    .select(PROFESSIONAL_SELECT, { count: 'exact' })
    .in('status', ['approved', 'featured']);

  if (filters.citySlug) {
    const cityName = getCityName(filters.citySlug);
    if (cityName) query = query.eq('city', cityName);
  }
  if (filters.district) query = query.eq('district', filters.district);
  if (filters.professionalType) query = query.eq('professional_type', filters.professionalType);
  if (filters.online === true) query = query.eq('is_online', true);
  if (filters.inPerson === true) query = query.eq('is_in_person', true);
  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(`name.ilike.${term},about.ilike.${term}`);
  }
  if (specialtyProfIds !== null && specialtyProfIds.length > 0) {
    query = query.in('id', specialtyProfIds);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    logError('getTherapistsPaged', error);
    return { therapists: [], total: 0 };
  }

  console.log(
    `[terapimap:queries] getTherapistsPaged(page=${page}, pageSize=${pageSize}) -> ${data?.length ?? 0}/${count ?? 0}`,
  );

  return {
    therapists: (data ?? []).map((row: any) => ({
      ...(row as Professional),
      specialties: flattenSpecialties(row),
    })) as ProfessionalWithSpecialties[],
    total: count ?? 0,
  };
}

export async function getSpecialtyBySlug(slug: string): Promise<Specialty | null> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from('specialties')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) { logError('getSpecialtyBySlug', error); return null; }
  return data ?? null;
}

export async function getCityCounts(): Promise<Record<string, number>> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from('professionals')
    .select('city')
    .in('status', ['approved', 'featured']);

  if (error) {
    logError('getCityCounts', error);
    return {};
  }
  // Accumulate counts keyed by slug (derived from city name)
  return (data ?? []).reduce<Record<string, number>>((acc, row: any) => {
    const slug = getCitySlug(row.city) ?? row.city?.toLowerCase() ?? 'unknown';
    acc[slug] = (acc[slug] ?? 0) + 1;
    return acc;
  }, {});
}

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
  const supabase = getServerClient();
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
