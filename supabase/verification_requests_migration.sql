-- =====================================================================
-- Terapimap — Verification Requests Migration
-- Run this ONCE in the Supabase SQL Editor.
-- It is idempotent: safe to run multiple times.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1. Add new columns to professionals table
-- ─────────────────────────────────────────────────────────────────────

alter table public.professionals
  add column if not exists verification_status text not null default 'unverified';

alter table public.professionals
  add column if not exists is_visible boolean not null default true;

alter table public.professionals
  add column if not exists removed_at timestamptz;

alter table public.professionals
  add column if not exists removal_reason text;

-- Make sure is_verified exists (it may already)
alter table public.professionals
  add column if not exists is_verified boolean not null default false;

-- Indexes
create index if not exists professionals_is_visible_idx on public.professionals (is_visible);
create index if not exists professionals_removed_at_idx on public.professionals (removed_at);

-- ─────────────────────────────────────────────────────────────────────
-- 2. Create therapist_verification_requests table
-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.therapist_verification_requests (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid references public.professionals(id) on delete cascade,
  request_type    text not null check (request_type in ('update', 'photo_update', 'removal')),
  full_name       text not null,
  email           text not null,
  phone           text not null,
  title           text,
  city            text,
  district        text,
  clinic_name     text,
  address         text,
  website         text,
  instagram       text,
  offers_online   boolean,
  offers_in_person boolean,
  specialties     text[],
  bio             text,
  photo_url       text,
  message         text,
  status          text not null default 'pending'
                    check (status in ('pending', 'approved', 'rejected', 'removal_requested', 'removed')),
  admin_note      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_therapist_verification_requests_updated_at
  on public.therapist_verification_requests;

create trigger set_therapist_verification_requests_updated_at
  before update on public.therapist_verification_requests
  for each row execute function public.set_updated_at();

-- Indexes
create index if not exists tvr_professional_id_idx on public.therapist_verification_requests (professional_id);
create index if not exists tvr_status_idx          on public.therapist_verification_requests (status);
create index if not exists tvr_email_idx           on public.therapist_verification_requests (email);
create index if not exists tvr_created_at_idx      on public.therapist_verification_requests (created_at desc);

-- ─────────────────────────────────────────────────────────────────────
-- 3. RLS — therapist_verification_requests
--    Public users can INSERT only.
--    SELECT / UPDATE / DELETE only via service-role (bypasses RLS).
-- ─────────────────────────────────────────────────────────────────────

alter table public.therapist_verification_requests enable row level security;

drop policy if exists "anyone can submit a verification request"
  on public.therapist_verification_requests;

create policy "anyone can submit a verification request"
  on public.therapist_verification_requests
  for insert
  with check (true);

-- ─────────────────────────────────────────────────────────────────────
-- 4. Update professionals RLS to also check is_visible
--    (service-role always bypasses RLS so admin operations are unaffected)
-- ─────────────────────────────────────────────────────────────────────

drop policy if exists "professionals are publicly readable" on public.professionals;
create policy "professionals are publicly readable"
  on public.professionals for select
  using (
    status in ('approved', 'featured')
    and is_visible = true
    and removed_at is null
  );

-- ─────────────────────────────────────────────────────────────────────
-- 5. Storage bucket: therapist-photos (create if not exists)
--    Do this in the Supabase Dashboard → Storage → New Bucket
--    if you prefer the UI, or uncomment the line below if using CLI.
--    Name: therapist-photos, Public: true
-- ─────────────────────────────────────────────────────────────────────
-- insert into storage.buckets (id, name, public)
-- values ('therapist-photos', 'therapist-photos', true)
-- on conflict (id) do nothing;

-- drop policy if exists "therapist-photos public read" on storage.objects;
-- create policy "therapist-photos public read"
--   on storage.objects for select
--   using (bucket_id = 'therapist-photos');

-- drop policy if exists "therapist-photos anon upload" on storage.objects;
-- create policy "therapist-photos anon upload"
--   on storage.objects for insert
--   with check (bucket_id = 'therapist-photos');
