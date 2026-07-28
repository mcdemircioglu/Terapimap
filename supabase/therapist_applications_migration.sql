-- =====================================================================
-- Terapist başvurusu ("Uzman Üye Ol") — request_type'a 'new' ekle
-- therapist_verification_requests tablosu yeniden kullanılır:
-- professional_id NULL = yeni kayıt başvurusu.
-- Supabase SQL Editor'de MANUEL çalıştırın. Idempotent.
-- =====================================================================

alter table public.therapist_verification_requests
  drop constraint if exists therapist_verification_requests_request_type_check;

alter table public.therapist_verification_requests
  add constraint therapist_verification_requests_request_type_check
  check (request_type in ('new', 'update', 'photo_update', 'removal'));

-- Bekleyen başvuruları admin panelde hızlı listelemek için index
create index if not exists tvr_type_status_idx
  on public.therapist_verification_requests (request_type, status, created_at desc);

-- Başvuruda meslek türü (Psikolog / Klinik Psikolog / Psikiyatrist / ...)
alter table public.therapist_verification_requests
  add column if not exists professional_type text;

-- Başvuruda Google Haritalar bağlantısı (opsiyonel) — onaylanınca profile taşınır.
alter table public.therapist_verification_requests
  add column if not exists google_maps_url text;
