-- ─────────────────────────────────────────────────────────────────────
-- Migration: professionals tablosuna status ve is_verified kolonları ekle
-- Supabase SQL Editor'da çalıştır.
-- ─────────────────────────────────────────────────────────────────────

alter table public.professionals
  add column if not exists status text not null default 'pending'
    check (status in ('pending', 'active', 'rejected', 'inactive'));

alter table public.professionals
  add column if not exists is_verified boolean not null default false;

-- Opsiyonel: import verisi için faydalı ekstra kolonlar
alter table public.professionals
  add column if not exists phone       text;

alter table public.professionals
  add column if not exists website_url text;

alter table public.professionals
  add column if not exists email       text;

alter table public.professionals
  add column if not exists source_url  text;

-- index
create index if not exists professionals_status_idx      on public.professionals (status);
create index if not exists professionals_is_verified_idx on public.professionals (is_verified);

-- Mevcut kayıtları güncelle (seed data)
update public.professionals
set status = 'pending', is_verified = false
where status is null or status = '';
