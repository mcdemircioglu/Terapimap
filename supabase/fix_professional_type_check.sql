-- professional_type CHECK constraint'ini uygulamanın tüm geçerli türlerini
-- kapsayacak şekilde günceller. "Çocuk Psikiyatristi" (child_psychiatrist) ve
-- "Aile Terapisti" (family_therapist) eski constraint'te eksik olduğu için
-- admin düzenlemede reddediliyordu.
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırılabilir (idempotent).

-- 1) (Opsiyonel) Mevcut verilerde beklenmedik bir tür var mı? Boş dönmeli:
-- select distinct professional_type from public.professionals
-- where professional_type is not null
--   and professional_type not in (
--     'psychologist','clinical_psychologist','psychiatrist',
--     'child_psychiatrist','family_therapist','counselor');

-- 2) Eski constraint'i kaldır, tam setle yeniden ekle (NULL serbest):
alter table public.professionals
  drop constraint if exists professionals_professional_type_check;

alter table public.professionals
  add constraint professionals_professional_type_check
  check (
    professional_type is null
    or professional_type in (
      'psychologist',
      'clinical_psychologist',
      'psychiatrist',
      'child_psychiatrist',
      'family_therapist',
      'counselor'
    )
  );
