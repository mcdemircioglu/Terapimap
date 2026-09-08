-- =====================================================================
-- Faz 1 / Adım 2: Terapist paneli için auth + RLS temeli
-- Supabase SQL Editor'da bir kez çalıştırın.
--
-- Kapsam:
--   1) professionals: kullanıcı kendi satırını okuyabilir, sınırlı bir
--      kolon setini güncelleyebilir (satır bazlı RLS + kolon bazlı GRANT).
--   2) leads: kullanıcı yalnızca kendi profiline gelen talepleri okuyabilir
--      (yazma/durum güncelleme Adım 6'da eklenecek).
--
-- Not: Admin paneli service-role client kullanır (getServiceClient),
-- bu yüzden RLS ve aşağıdaki GRANT/REVOKE admin akışlarını etkilemez.
--
-- Kolon adları information_schema.columns sorgusuyla canlı veritabanından
-- doğrulanmıştır (schema.sql dosyasındaki bazı adlar güncel değildi:
-- photo_url → image_url, city_slug/is_published canlıda hiç yok).
-- =====================================================================

-- ---------------------------------------------------------------------
-- professionals.user_id kolonunu garanti et.
-- schema.sql dosyasında tanımlı olsa da canlı veritabanına hiç
-- eklenmemiş olduğu doğrulandı — bu satır idempotent, kolon zaten varsa
-- hiçbir şey yapmaz.
-- ---------------------------------------------------------------------
alter table public.professionals
  add column if not exists user_id uuid;

create index if not exists professionals_user_id_idx
  on public.professionals (user_id);

-- ---------------------------------------------------------------------
-- professionals: kendi satırını okuma
-- ---------------------------------------------------------------------
drop policy if exists "professionals can read own row" on public.professionals;
create policy "professionals can read own row"
  on public.professionals for select
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- professionals: kendi satırını güncelleme (satır bazlı)
-- ---------------------------------------------------------------------
drop policy if exists "professionals can update own row" on public.professionals;
create policy "professionals can update own row"
  on public.professionals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- professionals: kolon bazlı yazma izni.
-- authenticated rolünün UPDATE hakkını tamamen kaldırıp yalnızca
-- terapistin kendi kendine değiştirebileceği "kimlik/itibar dışı" alanlara
-- izin veriyoruz. slug, city, is_verified, verification_status,
-- is_featured, featured_until, rating, status, is_visible, user_id, email
-- gibi alanlar bu listede YOK — bunlar yönetici/onay süreçlerine ait ve
-- yalnızca service-role ile değiştirilebilir.
-- ---------------------------------------------------------------------
revoke update on public.professionals from authenticated;
grant update (
  title,
  professional_type,
  district,
  is_online,
  is_in_person,
  experience_years,
  about,
  price_range,
  image_url,
  clinic_name,
  address,
  google_maps_url,
  phone,
  website_url,
  instagram_url
) on public.professionals to authenticated;

-- ---------------------------------------------------------------------
-- leads: yalnızca kendi profiline gelen talepleri okuma
-- ---------------------------------------------------------------------
drop policy if exists "professionals can read own leads" on public.leads;
create policy "professionals can read own leads"
  on public.leads for select
  using (
    exists (
      select 1 from public.professionals p
      where p.id = leads.professional_id
        and p.user_id = auth.uid()
    )
  );
