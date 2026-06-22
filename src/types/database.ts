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
