-- =====================================================================
-- Terapimap — Native Danışan Değerlendirme Sistemi (Reviews) Migration
-- Supabase SQL Editor'da bir kez çalıştırın. İdempotenttir.
--
-- Kapsam:
--   1) reviews tablosu: danışanların terapist profilinden gönderdiği
--      puan + yorum. Varsayılan durum 'pending' — admin onaylamadan
--      (status = 'approved') hiçbir yorum public tarafta görünmez
--      (leads / therapist_verification_requests ile aynı moderasyon
--      deseni).
--   2) is_verified: danışanın e-postası, o terapiste ait "confirmed"
--      bir randevunun client_email'i ile eşleşiyorsa true olur
--      ("Doğrulanmış Danışan" rozeti). Bu alan yalnızca sunucu
--      tarafında (service-role, bkz. /api/reviews) hesaplanıp yazılır.
--   3) professionals.rating (statik, elle girilen puan) BU MİGRASYONLA
--      DEĞİŞTİRİLMİYOR — sıralama/filtreleme hâlâ o alanı kullanıyor.
--      Yeni "Değerlendirmeler" bölümü approved review'lardan hesaplanan
--      ortalamayı ayrıca gösterir. rating alanının tamamen hesaplanan
--      ortalamaya geçişi ileride ayrı bir karar/adım.
-- =====================================================================

create table if not exists public.reviews (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  reviewer_name   text not null,
  reviewer_email  text not null,
  is_anonymous    boolean not null default false,
  rating          smallint not null check (rating between 1 and 5),
  comment         text not null,
  is_verified     boolean not null default false,
  status          text not null default 'pending'
                    check (status in ('pending', 'approved', 'rejected')),
  admin_note      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists reviews_professional_id_idx on public.reviews (professional_id);
create index if not exists reviews_status_idx          on public.reviews (status);
create index if not exists reviews_email_idx           on public.reviews (reviewer_email);
create index if not exists reviews_created_at_idx       on public.reviews (created_at desc);
-- Onaylanmış yorumları profil sayfasında hızlı çekmek için.
create index if not exists reviews_professional_approved_idx
  on public.reviews (professional_id, status);

-- updated_at trigger (diğer migrasyonlarla aynı idempotent helper).
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_reviews_updated_at on public.reviews;
create trigger set_reviews_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- RLS
--   - INSERT: herkese açık, ama is_verified=false ve status='pending'
--     dışında bir değerle satır sokulamaz (asıl yazma zaten /api/reviews
--     içinde service-role ile yapılıyor; bu policy savunma amaçlı —
--     anon key ile doğrudan Supabase'e yazılsa bile sahte "onaylı" veya
--     "doğrulanmış" bir yorum oluşturulamaz).
--   - SELECT: yalnızca status='approved' olan satırlar herkese açık.
--   - UPDATE / DELETE: public policy yok — sadece service-role (admin).
-- ---------------------------------------------------------------------

alter table public.reviews enable row level security;

drop policy if exists "anyone can submit a review" on public.reviews;
create policy "anyone can submit a review"
  on public.reviews
  for insert
  with check (status = 'pending' and is_verified = false);

drop policy if exists "approved reviews are publicly readable" on public.reviews;
create policy "approved reviews are publicly readable"
  on public.reviews
  for select
  using (status = 'approved');
