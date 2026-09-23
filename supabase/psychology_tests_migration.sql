-- =====================================================================
-- Psikoloji Testleri — psychology_tests + test_submissions
-- Faz 1 / adım 1: veri modeli. Run this in the Supabase SQL editor.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. psychology_tests
-- ---------------------------------------------------------------------
create table if not exists public.psychology_tests (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title_tr      text not null,
  title_en      text,
  intro_tr      text,
  kind          text not null default 'clinical' check (kind in ('clinical', 'viral')),
  source_label  text,                 -- e.g. "GAD-7"
  specialty_id  uuid references public.specialties(id),
  questions     jsonb not null default '[]'::jsonb,
  -- [{ "id": "q1", "text_tr": "..." }, ...] — cevap seçenekleri her testte ortak
  -- olduğundan (Likert skalası) sorularda tekrar etmez, scoring.scale'de tanımlanır.
  scoring       jsonb not null default '{"scale":[],"max_score":0,"tiers":[]}'::jsonb,
  -- { "scale": [{ "label_tr": "Hiç", "value": 0 }, ...],
  --   "max_score": 21,
  --   "tiers": [{ "min": 0, "max": 4, "label_tr": "Minimal düzey", "summary_tr": "..." }, ...] }
  is_published  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists psychology_tests_is_published_idx on public.psychology_tests (is_published);
create index if not exists psychology_tests_specialty_idx    on public.psychology_tests (specialty_id);

drop trigger if exists psychology_tests_set_updated_at on public.psychology_tests;
create trigger psychology_tests_set_updated_at
  before update on public.psychology_tests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 2. test_submissions
-- ---------------------------------------------------------------------
create table if not exists public.test_submissions (
  id                 uuid primary key default gen_random_uuid(),
  test_id            uuid not null references public.psychology_tests(id) on delete cascade,
  score              integer not null,
  tier_label         text not null,
  email              text,
  consent_marketing  boolean not null default false,
  city_slug          text,
  created_at         timestamptz not null default now()
);

create index if not exists test_submissions_test_id_idx    on public.test_submissions (test_id);
create index if not exists test_submissions_created_at_idx on public.test_submissions (created_at desc);

-- ---------------------------------------------------------------------
-- 3. Row Level Security
-- ---------------------------------------------------------------------
alter table public.psychology_tests enable row level security;
alter table public.test_submissions enable row level security;

drop policy if exists "published tests are publicly readable" on public.psychology_tests;
create policy "published tests are publicly readable"
  on public.psychology_tests for select
  using (is_published = true);

-- anyone can submit a test result (insert), but no one can read submissions from the client.
-- Use the service role key (server-side) to read test_submissions in an admin tool later —
-- same pattern as public.leads.
drop policy if exists "anyone can submit a test result" on public.test_submissions;
create policy "anyone can submit a test result"
  on public.test_submissions for insert
  with check (true);

-- ---------------------------------------------------------------------
-- 4. Seed / adım 2: Kaygı Testi (GAD-7 tabanlı) — sorular ve puanlama
--    dolduruldu. GAD-7 (Spitzer, Kroenke, Williams, Löwe, 2006) kamuya açık,
--    serbestçe kullanılabilen bir tarama ölçeğidir; Türkçe ifadeler burada
--    standart GAD-7 maddelerinin genel kabul görmüş bir çevirisidir.
--    is_published hâlâ false — route/bileşen hazır olup gözden geçirilmeden
--    (ve klinik onay sorusu netleşmeden) yayına almıyoruz.
--    Upsert: dosya daha önce boş taslakla çalıştırılmış olsa da güvenle
--    tekrar çalıştırılabilir.
-- ---------------------------------------------------------------------
insert into public.psychology_tests
  (slug, title_tr, title_en, intro_tr, kind, source_label, specialty_id, questions, scoring, is_published)
select
  'kaygi-testi',
  'Kaygı Testi',
  'Anxiety Test',
  'Son 2 haftadır yaşadığınız kaygı belirtilerinin sıklığını değerlendiren 7 soruluk kısa bir öz-değerlendirme aracı. Bir tanı aracı değildir.',
  'clinical',
  'GAD-7',
  (select id from public.specialties where slug = 'anksiyete'),
  '[
    { "id": "q1", "text_tr": "Sinirli, endişeli ya da gergin hissetme" },
    { "id": "q2", "text_tr": "Endişelenmeyi durduramama ya da kontrol edememe" },
    { "id": "q3", "text_tr": "Farklı şeyler hakkında çok fazla endişelenme" },
    { "id": "q4", "text_tr": "Rahatlamada güçlük çekme" },
    { "id": "q5", "text_tr": "Yerinde duramayacak kadar huzursuz olma" },
    { "id": "q6", "text_tr": "Kolayca sinirlenme ya da huzursuzlaşma" },
    { "id": "q7", "text_tr": "Sanki kötü bir şey olacakmış gibi korku hissetme" }
  ]'::jsonb,
  '{
    "scale": [
      { "label_tr": "Hiç", "value": 0 },
      { "label_tr": "Birkaç gün", "value": 1 },
      { "label_tr": "Yarısından fazla gün", "value": 2 },
      { "label_tr": "Hemen hemen her gün", "value": 3 }
    ],
    "max_score": 21,
    "tiers": [
      { "min": 0,  "max": 4,  "label_tr": "Minimal düzey",  "summary_tr": "Belirttiğiniz yanıtlara göre kaygı belirtileriniz minimal düzeyde görünüyor. Kaygı hissiniz günlük yaşamınızı etkiliyorsa bir uzmanla görüşmek yine de faydalı olabilir." },
      { "min": 5,  "max": 9,  "label_tr": "Hafif düzey",    "summary_tr": "Hafif düzeyde kaygı belirtileri gösteriyorsunuz. Bu belirtiler zaman zaman günlük yaşamınızı etkileyebilir; bir uzmanla konuşmak destekleyici olabilir." },
      { "min": 10, "max": 14, "label_tr": "Orta düzey",     "summary_tr": "Orta düzeyde kaygı belirtileri gösteriyorsunuz. Bu düzeydeki belirtiler genellikle günlük yaşamı etkiler; bir uzmana danışmanızı öneririz." },
      { "min": 15, "max": 21, "label_tr": "Yüksek düzey",   "summary_tr": "Yüksek düzeyde kaygı belirtileri gösteriyorsunuz. Bu sonuç bir tanı değildir, ancak belirtileriniz için bir uzmandan destek almanız önemle önerilir." }
    ]
  }'::jsonb,
  false
on conflict (slug) do update set
  intro_tr     = excluded.intro_tr,
  source_label = excluded.source_label,
  specialty_id = excluded.specialty_id,
  questions    = excluded.questions,
  scoring      = excluded.scoring;
