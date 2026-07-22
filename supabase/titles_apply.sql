-- =====================================================================
-- UYGULAMA — unvan kısaltmalarını isimlere ekle
--
-- GÜVENLİK:
--   * Kurum kayıtları ve isminde unvan/kurum kalıntısı kalanlar ATLANIR
--     (dokunulmaz) — bunları BÖLÜM 3'teki sorgu ile görüp elle düzeltin.
--   * Idempotent: ikinci kez çalıştırmak isimleri bozmaz.
--   * ÖNCE yedek almanız önerilir (BÖLÜM 0).
-- =====================================================================

-- ── BÖLÜM 0: YEDEK (bir kez; sonradan geri almak isterseniz) ─────────
create table if not exists public.professionals_name_backup as
select id, name, title, updated_at, now() as backed_up_at
from public.professionals;

-- ── Ortak dönüşüm mantığı (view yerine tekrarlanan CTE) ─────────────
-- name → temiz_name (unvan/şehir/pislik temizlenmiş) + prefix (type/title)

with base as (
  select
    id, name, professional_type, lower(coalesce(title,'')) as t,
    btrim(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(name, '\s*[|/].*$', '', 'g'),
              '^\s*(istanbul|ankara|izmir|bursa|antalya|adana|konya|gaziantep|kocaeli|mersin|eskişehir|samsun|trabzon|kayseri|denizli)\s+', '', 'i'
            ),
            '^\s*((uzman|uzm|klinik|klinİk|klın|kln|psikoloğu|psikologu|psikolojik|psikolog|danışmanı|danışman|danisman|dan|psikiyatristi|psikiyatrist|psikiyatri|psikoterapist|pedagog|çocuk|ergen|aile|terapisti|terapist|prof|doç|doc|dr|uz|kl|psk)\.?\s+)+', '', 'i'
          ),
          '^[\s.,\-]+', '', 'g'
        ),
        '[\s.,\-]+$', '', 'g'
      )
    ) as temiz_name
  from public.professionals
  where removed_at is null
),
calc as (
  select
    id, name, professional_type, temiz_name,
    case
      when professional_type = 'clinical_psychologist' then 'Uzm. Kln. Psk.'
      when professional_type = 'counselor'             then 'Psk. Dan.'
      when professional_type = 'family_therapist'      then 'Aile Ter.'
      when professional_type = 'psychiatrist' then
        case when t ~ 'prof' then 'Prof. Dr.'
             when t ~ 'do[çc]' then 'Doç. Dr.'
             else 'Uzm. Dr.' end
      when professional_type = 'psychologist' then
        case when t ~ 'prof' then 'Prof. Dr.'
             when t ~ 'do[çc]' then 'Doç. Dr.'
             when t ~ 'kl[iı]n' then 'Uzm. Kln. Psk.'
             when t ~ 'uzm(an)?\.?\s*psikolog' then 'Uzm. Psk.'
             else 'Psk.' end
      else 'Psk.'
    end as prefix
  from base
),
safe as (
  select *, (prefix || ' ' || temiz_name) as yeni_name
  from calc
  where temiz_name <> ''
    -- kurum/unvan kalıntısı olanları HARİÇ tut (elle düzeltilecek)
    and temiz_name !~* '(merkez|psikoloji|psikolog|psikiyatr|klinik|danışman|terapi|enstitü|\||/)'
    -- zaten doğru kısaltmayla başlıyorsa atla (idempotent)
    and name not ilike (prefix || ' %')
)
update public.professionals p
set name = s.yeni_name,
    updated_at = now()
from safe s
where p.id = s.id;

-- ── BÖLÜM 2: Kaç kayıt güncellendi? ─────────────────────────────────
-- (yukarıdaki UPDATE'in etkilediği satır sayısını SQL Editor gösterir)

-- ── BÖLÜM 3: ATLANANLAR — elle kontrol edilmeli ────────────────────
-- Kurum isimleri, tire/kalıntı içerenler, ismi tamamen unvandan ibaret olanlar
with base as (
  select
    id, name, professional_type,
    btrim(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(name, '\s*[|/].*$', '', 'g'),
              '^\s*(istanbul|ankara|izmir|bursa|antalya|adana|konya|gaziantep|kocaeli|mersin|eskişehir|samsun|trabzon|kayseri|denizli)\s+', '', 'i'
            ),
            '^\s*((uzman|uzm|klinik|klinİk|klın|kln|psikoloğu|psikologu|psikolojik|psikolog|danışmanı|danışman|danisman|dan|psikiyatristi|psikiyatrist|psikiyatri|psikoterapist|pedagog|çocuk|ergen|aile|terapisti|terapist|prof|doç|doc|dr|uz|kl|psk)\.?\s+)+', '', 'i'
          ),
          '^[\s.,\-]+', '', 'g'
        ),
        '[\s.,\-]+$', '', 'g'
      )
    ) as temiz_name
  from public.professionals
  where removed_at is null
)
select id, name, professional_type, temiz_name
from base
where temiz_name = ''
   or temiz_name ~* '(merkez|psikoloji|psikolog|psikiyatr|klinik|danışman|terapi|enstitü|\||/)'
order by professional_type, name;


-- =====================================================================
-- BÖLÜM 4: TITLE NORMALİZASYONU
-- title alanı professional_type'a göre düzgün tam unvana çevrilir.
-- İsimdeki kısaltmayla birebir uyumludur. Tüm kayıtlarda çalışır.
-- Idempotent — tekrar çalıştırmak sorun çıkarmaz.
-- =====================================================================
update public.professionals p
set title = case
      when p.professional_type = 'clinical_psychologist' then 'Uzman Klinik Psikolog'
      when p.professional_type = 'counselor'             then 'Psikolojik Danışman'
      when p.professional_type = 'family_therapist'      then 'Aile Terapisti'
      when p.professional_type = 'psychiatrist'          then 'Psikiyatrist'
      when p.professional_type = 'psychologist' then
        case
          when lower(coalesce(p.title,'')) ~ 'kl[iı]n'               then 'Klinik Psikolog'
          when lower(coalesce(p.title,'')) ~ 'uzm(an)?\.?\s*psikolog' then 'Uzman Psikolog'
          else 'Psikolog'
        end
      else 'Psikolog'
    end,
    updated_at = now()
where removed_at is null;

-- Kontrol: title dağılımı artık temiz olmalı (7 değer)
select professional_type, title, count(*) as adet
from public.professionals
where removed_at is null
group by professional_type, title
order by professional_type, adet desc;
