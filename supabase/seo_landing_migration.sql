-- ============================================================================
-- SEO Landing Pages Migration
-- Supabase SQL Editor'de bir kez çalıştırın. Mevcut veriyi bozmaz
-- (yalnızca yeni kolon ve tablo ekler; hepsi opsiyonel/nullable).
-- ============================================================================

-- 1. specialties tablosuna SEO alanları --------------------------------------
alter table public.specialties
  add column if not exists seo_title       text,
  add column if not exists seo_description text,
  add column if not exists seo_intro       text,
  add column if not exists seo_faqs        jsonb,
  add column if not exists category        text,
  add column if not exists is_indexable    boolean not null default true;

comment on column public.specialties.seo_title       is 'Özel meta title (boşsa şablondan üretilir)';
comment on column public.specialties.seo_description is 'Özel meta description (boşsa şablondan üretilir)';
comment on column public.specialties.seo_intro       is 'Özel giriş metni (boşsa şablondan üretilir)';
comment on column public.specialties.seo_faqs        is 'SSS listesi: [{"q":"...","a":"..."}]';
comment on column public.specialties.category        is 'Gruplama: therapy_method | condition | audience vb.';
comment on column public.specialties.is_indexable    is 'false ise bu uzmanlığın landing sayfaları noindex olur';

-- 2. Şehir + uzmanlık özel içerik tablosu ------------------------------------
create table if not exists public.seo_landing_pages (
  id             uuid primary key default gen_random_uuid(),
  city_slug      text not null,
  specialty_slug text not null,
  title          text,
  description    text,
  h1             text,
  intro_content  text,
  faq_json       jsonb,
  canonical_url  text,
  is_indexable   boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (city_slug, specialty_slug)
);

create index if not exists seo_landing_pages_lookup_idx
  on public.seo_landing_pages (city_slug, specialty_slug);

-- updated_at trigger'ı (professionals ile aynı yardımcı fonksiyonu kullanır;
-- fonksiyon yoksa oluştur)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists seo_landing_pages_updated_at on public.seo_landing_pages;
create trigger seo_landing_pages_updated_at
  before update on public.seo_landing_pages
  for each row execute function public.set_updated_at();

-- 3. RLS ----------------------------------------------------------------------
-- Herkese okuma açık (landing içeriği kamuya açıktır);
-- yazma yalnızca service_role ile (admin API'leri service client kullanıyor).
alter table public.seo_landing_pages enable row level security;

drop policy if exists "public can read seo landing pages" on public.seo_landing_pages;
create policy "public can read seo landing pages"
  on public.seo_landing_pages for select
  using (true);

-- ============================================================================
-- ROLLBACK (gerekirse):
--   drop table if exists public.seo_landing_pages;
--   alter table public.specialties
--     drop column if exists seo_title,
--     drop column if exists seo_description,
--     drop column if exists seo_intro,
--     drop column if exists seo_faqs,
--     drop column if exists category,
--     drop column if exists is_indexable;
-- Not: set_updated_at fonksiyonu başka tablolarca da kullanılıyor olabilir;
-- rollback'te fonksiyonu DÜŞÜRMEYİN.
-- ============================================================================
