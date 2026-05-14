-- =====================================================================
-- Terapimap — schema migration
-- Run this ONCE in the Supabase SQL editor (Dashboard → SQL Editor).
-- It is idempotent: safe to run multiple times.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1. specialties: add name_tr / name_en
--    The old schema had a single "name" column.
--    We rename it to name_tr and add name_en.
-- ─────────────────────────────────────────────────────────────────────

do $$ begin
  -- rename "name" → "name_tr" if the old column is still there
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'specialties'
      and column_name  = 'name'
  ) then
    alter table public.specialties rename column "name" to name_tr;
  end if;
end $$;

-- add name_en if missing
alter table public.specialties
  add column if not exists name_en text not null default '';

-- make sure name_tr is not null (safety)
alter table public.specialties
  alter column name_tr set not null;

-- ─────────────────────────────────────────────────────────────────────
-- 2. professionals: add missing columns
-- ─────────────────────────────────────────────────────────────────────

alter table public.professionals
  add column if not exists is_published     boolean not null default true;

alter table public.professionals
  add column if not exists is_featured      boolean not null default false;

alter table public.professionals
  add column if not exists professional_type text;   -- psychologist | clinical_psychologist | psychiatrist | family_therapist | counselor

alter table public.professionals
  add column if not exists updated_at       timestamptz not null default now();

-- indexes (idempotent)
create index if not exists professionals_is_published_idx on public.professionals (is_published);
create index if not exists professionals_is_featured_idx  on public.professionals (is_featured);

-- ─────────────────────────────────────────────────────────────────────
-- 3. RLS policies — recreate so the is_published filter works
-- ─────────────────────────────────────────────────────────────────────

alter table public.professionals            enable row level security;
alter table public.specialties              enable row level security;
alter table public.professional_specialties enable row level security;
alter table public.leads                    enable row level security;

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

drop policy if exists "anyone can submit a lead" on public.leads;
create policy "anyone can submit a lead"
  on public.leads for insert
  with check (true);

-- ─────────────────────────────────────────────────────────────────────
-- 4. Back-fill specialty translations
--    Upsert all 12 specialties with proper name_tr + name_en.
-- ─────────────────────────────────────────────────────────────────────

-- The old schema had UNIQUE on "name"; after rename it became UNIQUE on name_tr.
-- name_tr doesn't need to be unique (slug already is), so drop the stale constraint.
alter table public.specialties drop constraint if exists specialties_name_key;

insert into public.specialties (slug, name_tr, name_en) values
  ('anksiyete',         'Anksiyete',                  'Anxiety'),
  ('depresyon',         'Depresyon',                  'Depression'),
  ('cift-terapisi',     'Çift Terapisi',              'Couples Therapy'),
  ('aile-terapisi',     'Aile Terapisi',              'Family Therapy'),
  ('travma',            'Travma ve EMDR',             'Trauma & EMDR'),
  ('cocuk-ergen',       'Çocuk ve Ergen',             'Child & Adolescent'),
  ('bdt',               'Bilişsel Davranışçı Terapi', 'CBT'),
  ('panik-bozukluk',    'Panik Bozukluk',             'Panic Disorder'),
  ('obsesif-kompulsif', 'Obsesif Kompulsif Bozukluk', 'OCD'),
  ('yas-kayip',         'Yas ve Kayıp',               'Grief & Loss'),
  ('ozguven',           'Özgüven ve Kişisel Gelişim', 'Self-esteem'),
  ('ilişki',            'İlişki Sorunları',           'Relationship Issues')
on conflict (slug) do update set
  name_tr = excluded.name_tr,
  name_en = excluded.name_en;

-- ─────────────────────────────────────────────────────────────────────
-- 5. Back-fill professionals: is_published, is_featured, professional_type
-- ─────────────────────────────────────────────────────────────────────

-- mark all existing rows as published
update public.professionals set is_published = true where is_published is distinct from true;

-- feature the 6 highest-rated professionals (homepage cards)
update public.professionals
set is_featured = true
where slug in (
  'zeynep-kaya',   -- 4.9
  'elif-yilmaz',   -- 4.8
  'deniz-arslan',  -- 4.8
  'serkan-acar',   -- 4.8
  'tolga-erdem',   -- 4.8
  'ahmet-celik'    -- 4.7
);

-- set professional_type from the title field
update public.professionals set professional_type =
  case
    when title ilike '%klinik psikolog%'  then 'clinical_psychologist'
    when title ilike '%psikiyatrist%'     then 'psychiatrist'
    when title ilike '%aile terapist%'    then 'family_therapist'
    when title ilike '%danışman%'         then 'counselor'
    when title ilike '%psikolog%'         then 'psychologist'
    when title ilike '%psikoterapist%'    then 'psychologist'   -- closest match
    else null
  end
where professional_type is null;

-- ─────────────────────────────────────────────────────────────────────
-- 6. Seed professional_specialties if the join table is empty
-- ─────────────────────────────────────────────────────────────────────

-- remove stale links for the seeded slugs, then re-insert
delete from public.professional_specialties
where professional_id in (
  select id from public.professionals where slug in (
    'elif-yilmaz','mert-demir','zeynep-kaya','ahmet-celik','sevgi-aydin','burak-sahin',
    'deniz-arslan','canan-ozturk','emre-koc','hande-yildiz','serkan-acar',
    'aylin-keskin','tolga-erdem','gizem-tunc','kaan-bulut','ipek-demirel',
    'cem-yavuz','selin-uzun'
  )
);

insert into public.professional_specialties (professional_id, specialty_id)
select p.id, s.id
from public.professionals p
join public.specialties s on true
where (p.slug, s.slug) in (
  ('elif-yilmaz',        'anksiyete'),
  ('elif-yilmaz',        'panik-bozukluk'),
  ('elif-yilmaz',        'bdt'),
  ('elif-yilmaz',        'ozguven'),
  ('mert-demir',         'depresyon'),
  ('mert-demir',         'ilişki'),
  ('mert-demir',         'bdt'),
  ('zeynep-kaya',        'travma'),
  ('zeynep-kaya',        'depresyon'),
  ('zeynep-kaya',        'anksiyete'),
  ('ahmet-celik',        'cift-terapisi'),
  ('ahmet-celik',        'aile-terapisi'),
  ('ahmet-celik',        'ilişki'),
  ('sevgi-aydin',        'anksiyete'),
  ('sevgi-aydin',        'ozguven'),
  ('burak-sahin',        'obsesif-kompulsif'),
  ('burak-sahin',        'panik-bozukluk'),
  ('burak-sahin',        'bdt'),
  ('deniz-arslan',       'depresyon'),
  ('deniz-arslan',       'anksiyete'),
  ('deniz-arslan',       'travma'),
  ('canan-ozturk',       'anksiyete'),
  ('canan-ozturk',       'ozguven'),
  ('emre-koc',           'aile-terapisi'),
  ('emre-koc',           'cift-terapisi'),
  ('emre-koc',           'cocuk-ergen'),
  ('hande-yildiz',       'cocuk-ergen'),
  ('hande-yildiz',       'bdt'),
  ('serkan-acar',        'yas-kayip'),
  ('serkan-acar',        'depresyon'),
  ('aylin-keskin',       'anksiyete'),
  ('aylin-keskin',       'ozguven'),
  ('aylin-keskin',       'bdt'),
  ('tolga-erdem',        'cift-terapisi'),
  ('tolga-erdem',        'ilişki'),
  ('gizem-tunc',         'depresyon'),
  ('gizem-tunc',         'ozguven'),
  ('kaan-bulut',         'travma'),
  ('kaan-bulut',         'depresyon'),
  ('ipek-demirel',       'obsesif-kompulsif'),
  ('ipek-demirel',       'panik-bozukluk'),
  ('ipek-demirel',       'bdt'),
  ('cem-yavuz',          'ozguven'),
  ('cem-yavuz',          'ilişki'),
  ('selin-uzun',         'cocuk-ergen'),
  ('selin-uzun',         'aile-terapisi')
)
on conflict do nothing;

-- ─────────────────────────────────────────────────────────────────────
-- 7. Seed professionals if the table is empty (fresh install)
-- ─────────────────────────────────────────────────────────────────────

insert into public.professionals
  (slug, name, title, professional_type, city, city_slug, district,
   is_online, is_in_person, experience_years, about, price_range,
   rating, is_published, is_featured)
values
  ('elif-yilmaz',  'Elif Yılmaz',  'Klinik Psikolog',  'clinical_psychologist', 'İstanbul','istanbul','Kadıköy',    true,  true,  9,  'Anksiyete, panik atak ve özgüven konularında bilişsel davranışçı terapi (BDT) odaklı çalışıyorum.',            '₺1.200 - ₺1.800', 4.8, true, true),
  ('mert-demir',   'Mert Demir',   'Uzman Psikolog',   'psychologist',          'İstanbul','istanbul','Beşiktaş',   true,  true,  6,  'Depresyon ve ilişki sorunları üzerine çalışıyorum.',                                                          '₺1.000 - ₺1.500', 4.6, true, false),
  ('zeynep-kaya',  'Zeynep Kaya',  'Klinik Psikolog',  'clinical_psychologist', 'İstanbul','istanbul','Şişli',      true,  false, 12, 'EMDR ve travma odaklı terapi alanında uzmanlaşmış bir klinik psikoloğum.',                                    '₺1.500 - ₺2.000', 4.9, true, true),
  ('ahmet-celik',  'Ahmet Çelik',  'Psikoterapist',    'psychologist',          'İstanbul','istanbul','Üsküdar',    false, true,  15, 'Çift ve aile terapisi alanında 15 yılı aşkın deneyime sahibim.',                                              '₺1.400 - ₺2.000', 4.7, true, true),
  ('sevgi-aydin',  'Sevgi Aydın',  'Uzman Psikolog',   'psychologist',          'İstanbul','istanbul','Beyoğlu',    true,  true,  4,  'Genç yetişkinlerle anksiyete, özgüven ve yaşam geçişleri üzerine çalışıyorum.',                               '₺900 - ₺1.300',   4.5, true, false),
  ('burak-sahin',  'Burak Şahin',  'Klinik Psikolog',  'clinical_psychologist', 'İstanbul','istanbul','Bakırköy',   true,  true,  8,  'Obsesif kompulsif bozukluk ve panik bozukluk alanında BDT temelli müdahaleler.',                              '₺1.100 - ₺1.600', 4.6, true, false),
  ('deniz-arslan', 'Deniz Arslan', 'Klinik Psikolog',  'clinical_psychologist', 'Ankara',  'ankara',  'Çankaya',    true,  true,  10, 'Yetişkinlerde depresyon, anksiyete ve travma. Bütüncül psikoterapi yaklaşımı.',                               '₺1.000 - ₺1.500', 4.8, true, true),
  ('canan-ozturk', 'Canan Öztürk', 'Uzman Psikolog',   'psychologist',          'Ankara',  'ankara',  'Çankaya',    true,  false, 7,  'Çevrimiçi seanslarla anksiyete, sosyal fobi ve özgüven konularında destek sunuyorum.',                        '₺900 - ₺1.300',   4.5, true, false),
  ('emre-koc',     'Emre Koç',     'Psikoterapist',    'family_therapist',      'Ankara',  'ankara',  'Kızılay',    false, true,  13, 'Aile terapisi, çift terapisi ve ergen psikoterapisi alanlarında çalışıyorum.',                                '₺1.200 - ₺1.700', 4.7, true, false),
  ('hande-yildiz', 'Hande Yıldız', 'Klinik Psikolog',  'clinical_psychologist', 'Ankara',  'ankara',  'Bahçelievler',true, true,  5,  'Çocuk ve ergenlerle oyun terapisi ve BDT yöntemleriyle çalışıyorum.',                                        '₺900 - ₺1.300',   4.6, true, false),
  ('serkan-acar',  'Serkan Acar',  'Uzman Psikolog',   'psychologist',          'Ankara',  'ankara',  'Çayyolu',    true,  true,  11, 'Yas, kayıp ve yaşam krizleri üzerine derinlikli psikoterapi.',                                                '₺1.100 - ₺1.600', 4.8, true, true),
  ('aylin-keskin', 'Aylin Keskin', 'Klinik Psikolog',  'clinical_psychologist', 'İzmir',   'izmir',   'Alsancak',   true,  true,  6,  'BDT ve şema terapi ile anksiyete bozuklukları ve özgüven sorunları üzerine çalışırım.',                       '₺900 - ₺1.300',   4.7, true, false),
  ('tolga-erdem',  'Tolga Erdem',  'Psikoterapist',    'family_therapist',      'İzmir',   'izmir',   'Karşıyaka',  false, true,  14, 'Çift terapisi ve ilişki sorunları. EFT (Duygu Odaklı Terapi) yaklaşımı.',                                    '₺1.200 - ₺1.700', 4.8, true, true),
  ('gizem-tunc',   'Gizem Tunç',   'Uzman Psikolog',   'psychologist',          'İzmir',   'izmir',   'Bornova',    true,  true,  4,  'Genç yetişkinlerle depresyon, motivasyon kaybı ve mesleki yön bulma.',                                        '₺800 - ₺1.200',   4.5, true, false),
  ('kaan-bulut',   'Kaan Bulut',   'Klinik Psikolog',  'clinical_psychologist', 'İzmir',   'izmir',   'Bostanlı',   true,  false, 9,  'EMDR ve travma sonrası stres bozukluğu (TSSB) alanında çevrimiçi terapi.',                                   '₺1.100 - ₺1.500', 4.6, true, false),
  ('ipek-demirel', 'İpek Demirel', 'Uzman Psikolog',   'psychologist',          'İzmir',   'izmir',   'Konak',      true,  true,  7,  'OKB ve panik bozuklukta kanıt temelli BDT müdahaleleri.',                                                    '₺1.000 - ₺1.400', 4.7, true, false),
  ('cem-yavuz',    'Cem Yavuz',    'Klinik Psikolog',  'clinical_psychologist', 'İstanbul','istanbul','Maltepe',    true,  true,  3,  'Yetişkinlerle özgüven, kariyer kaygısı ve ilişki konularında çalışıyorum.',                                   '₺800 - ₺1.200',   4.4, true, false),
  ('selin-uzun',   'Selin Uzun',   'Uzman Psikolog',   'psychologist',          'Ankara',  'ankara',  'Ümitköy',    true,  true,  8,  'Çocuk-ergen ve aile terapisi. Sistemik aile yaklaşımı.',                                                     '₺1.000 - ₺1.400', 4.7, true, false)
on conflict (slug) do update set
  professional_type = excluded.professional_type,
  is_published      = excluded.is_published,
  is_featured       = excluded.is_featured;

-- ─────────────────────────────────────────────────────────────────────
-- 8. leads: add status and source columns
-- ─────────────────────────────────────────────────────────────────────

alter table public.leads
  add column if not exists status text not null default 'new'
    check (status in ('new', 'reviewed', 'contacted', 'spam'));

alter table public.leads
  add column if not exists source text;

create index if not exists leads_status_idx on public.leads (status);

-- ─────────────────────────────────────────────────────────────────────
-- 9. professionals: add clinic_name column
-- ─────────────────────────────────────────────────────────────────────

alter table public.professionals
  add column if not exists clinic_name text;
