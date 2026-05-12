-- =====================================================================
-- Terapimap schema
-- Run this in the Supabase SQL editor, then run seed.sql.
-- =====================================================================

-- enable required extensions
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- specialties
-- ---------------------------------------------------------------------
create table if not exists public.specialties (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name_tr     text not null,
  name_en     text not null,
  created_at  timestamptz not null default now()
);

-- Drop stale unique constraint on name_tr (carried over from old "name" column).
alter table public.specialties drop constraint if exists specialties_name_key;

-- ---------------------------------------------------------------------
-- professionals
-- (psychologists, psychiatrists, psychotherapists — all "uzmanlar")
-- ---------------------------------------------------------------------
create table if not exists public.professionals (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  name              text not null,
  title             text,                 -- e.g. "Klinik Psikolog", "Uzm. Psk.", "Psikiyatrist"
  professional_type text,                 -- psychologist | clinical_psychologist | psychiatrist | family_therapist | counselor
  city              text not null,        -- "İstanbul", "Ankara", "İzmir"
  city_slug         text not null,        -- "istanbul", "ankara", "izmir"
  district          text,
  is_online         boolean not null default false,
  is_in_person      boolean not null default true,
  experience_years  integer not null default 0,
  about             text,
  price_range       text,                 -- e.g. "₺800 - ₺1.500"
  rating            real not null default 0,
  photo_url         text,
  user_id           uuid,                 -- future: links to auth.users for self-edit
  is_published      boolean not null default true,
  is_featured       boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists professionals_city_slug_idx   on public.professionals (city_slug);
create index if not exists professionals_is_online_idx    on public.professionals (is_online);
create index if not exists professionals_is_published_idx on public.professionals (is_published);
create index if not exists professionals_is_featured_idx  on public.professionals (is_featured);

-- ---------------------------------------------------------------------
-- professional_specialties (many-to-many)
-- ---------------------------------------------------------------------
create table if not exists public.professional_specialties (
  professional_id uuid not null references public.professionals(id) on delete cascade,
  specialty_id    uuid not null references public.specialties(id)    on delete cascade,
  primary key (professional_id, specialty_id)
);

create index if not exists professional_specialties_specialty_idx
  on public.professional_specialties (specialty_id);

-- ---------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------
create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  name            text not null,
  email           text not null,
  phone           text,
  message         text not null,
  created_at      timestamptz not null default now()
);

create index if not exists leads_professional_id_idx on public.leads (professional_id);
create index if not exists leads_created_at_idx     on public.leads (created_at desc);

-- ---------------------------------------------------------------------
-- updated_at trigger for professionals
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists professionals_set_updated_at on public.professionals;
create trigger professionals_set_updated_at
  before update on public.professionals
  for each row execute function public.set_updated_at();

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table public.professionals            enable row level security;
alter table public.specialties              enable row level security;
alter table public.professional_specialties enable row level security;
alter table public.leads                    enable row level security;

-- public can read published professionals, specialties, and the join table
drop policy if exists "professionals are publicly readable" on public.professionals;
create policy "professionals are publicly readable"
  on public.professionals for select
  using (is_published = true);

drop policy if exists "specialties are publicly readable" on public.specialties;
create policy "specialties are publicly readable"
  on public.specialties for select
  using (true);

drop policy if exists "professional_specialties are publicly readable" on public.professional_specialties;
create policy "professional_specialties are publicly readable"
  on public.professional_specialties for select
  using (true);

-- anyone can submit a lead (insert), but no one can read leads from the client.
-- Use the service role key (server-side) to read leads in an admin tool later.
drop policy if exists "anyone can submit a lead" on public.leads;
create policy "anyone can submit a lead"
  on public.leads for insert
  with check (true);
