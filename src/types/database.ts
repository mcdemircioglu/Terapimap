// Hand-written DB types. If you generate types via `supabase gen types typescript`,
// drop them in here and re-export the parts the app uses.

export type Specialty = {
  id: string;
  slug: string;
  name: string;
  created_at: string;
};

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
  counselor: "Psikolojik Danisман",
};

export type Professional = {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  professional_type: ProfessionalType | null;
  city: string;
  district: string | null;
  clinic_name: string | null;
  is_online: boolean;
  is_in_person: boolean;
  is_featured: boolean;
  experience_years: number;
  about: string | null;
  price_range: string | null;
  rating: number;
  photo_url: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfessionalWithSpecialties = Professional & {
  specialties: Specialty[];
};

export type Lead = {
  id: string;
  professional_id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  created_at: string;
};

export type NewLead = Omit<Lead, "id" | "created_at">;
