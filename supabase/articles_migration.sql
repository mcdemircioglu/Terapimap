-- =====================================================================
-- Psikoloji Rehberi — articles tablosu
-- Bu migration'ı Supabase SQL Editor'de MANUEL çalıştırın.
-- Mevcut tablolara dokunmaz; destructive işlem içermez.
-- Ön koşul: public.set_updated_at() fonksiyonu (schema.sql'de mevcut).
-- =====================================================================

create table if not exists public.articles (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  slug              text not null unique,
  excerpt           text not null,
  content           text not null,  -- Markdown formatında saklanır
  category          text not null default 'genel-psikoloji'
                    check (category in (
                      'terapi-rehberi',
                      'psikolojik-konular',
                      'terapi-yontemleri',
                      'cocuk-ve-ergen',
                      'iliskiler',
                      'genel-psikoloji'
                    )),
  cover_image_url   text,
  meta_title        text,
  meta_description  text,
  status            text not null default 'draft'
                    check (status in ('draft', 'published')),
  is_featured       boolean not null default false,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Liste sorguları için index'ler
create index if not exists articles_status_published_at_idx
  on public.articles (status, published_at desc);
create index if not exists articles_category_idx
  on public.articles (category);

-- updated_at trigger'ı (mevcut proje standardı: set_updated_at)
drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

-- PostgREST computed column: tahmini okuma süresi (dk).
-- Liste sorguları content gövdesini çekmeden bu alanı seçebilir.
create or replace function public.reading_minutes(a public.articles)
returns integer
language sql stable as $$
  select greatest(
    1,
    ceil(coalesce(array_length(regexp_split_to_array(trim(a.content), '\s+'), 1), 0) / 200.0)
  )::int
$$;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.articles enable row level security;

-- Public yalnızca yayınlanmış ve yayın tarihi gelmiş içerikleri okuyabilir.
drop policy if exists "published articles are publicly readable" on public.articles;
create policy "published articles are publicly readable"
  on public.articles for select
  using (
    status = 'published'
    and published_at is not null
    and published_at <= now()
  );

-- Yazma politikası bilinçli olarak YOK:
-- public insert/update/delete kapalıdır; admin işlemleri service role ile yapılır.
