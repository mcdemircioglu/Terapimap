-- =====================================================================
-- ÖNİZLEME — unvan normalizasyonu (HİÇBİR ŞEYİ DEĞİŞTİRMEZ)
-- Sonuçları inceleyin. "yeni_name" doğru görünüyorsa apply SQL'ini çalıştırırız.
-- =====================================================================

with base as (
  select
    id,
    name as eski_name,
    professional_type,
    lower(coalesce(title, '')) as t,
    -- 1) "|" ve sonrasını at, 2) baştaki şehir adını at,
    -- 3) baştaki tekrarlayan unvan kelimelerini at, 4) baş/son boşluk/noktalama temizle
    btrim(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(name, '\s*[|/].*$', '', 'g'),
            '^\s*(istanbul|ankara|izmir|bursa|antalya|adana|konya|gaziantep|kocaeli|mersin|eskişehir|samsun|trabzon|kayseri|denizli)\s+', '', 'i'
          ),
          '^\s*((uzman|uzm|klinik|klinİk|klın|kln|psikoloğu|psikologu|psikolojik|psikolog|danışman|danisman|danışmanı|dan|psikiyatristi|psikiyatrist|psikiyatri|psikoterapist|pedagog|çocuk|ergen|aile|terapisti|terapist|prof|doç|doc|dr|uz|kl|psk)\.?\s+)+', '', 'i'
        ),
        '^[\s.,\-]+', '', 'g'
      )
    ) as temiz_name
  from public.professionals
  where removed_at is null
),
prefixed as (
  select
    id, eski_name, professional_type, t, temiz_name,
    case
      when professional_type = 'clinical_psychologist' then 'Uzm. Kln. Psk.'
      when professional_type = 'counselor'             then 'Psk. Dan.'
      when professional_type = 'family_therapist'      then 'Aile Ter.'
      when professional_type = 'psychiatrist' then
        case
          when t ~ 'prof'       then 'Prof. Dr.'
          when t ~ 'do[çc]'     then 'Doç. Dr.'
          else 'Uzm. Dr.'
        end
      when professional_type = 'psychologist' then
        case
          when t ~ 'prof'                         then 'Prof. Dr.'
          when t ~ 'do[çc]'                       then 'Doç. Dr.'
          when t ~ 'kl[iı]n'                      then 'Uzm. Kln. Psk.'
          when t ~ 'uzm(an)?\.?\s*psikolog'       then 'Uzm. Psk.'
          else 'Psk.'
        end
      else 'Psk.'
    end as prefix
  from base
)
select
  eski_name,
  professional_type,
  prefix,
  temiz_name,
  (prefix || ' ' || temiz_name) as yeni_name
from prefixed
-- İsmi boşalanları (tamamen unvandan ibaret olanları) da görelim
order by (temiz_name = '') desc, professional_type, eski_name
limit 120;
