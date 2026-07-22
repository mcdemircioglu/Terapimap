-- =====================================================================
-- 2. PASS ÖNİZLEME — ilk turda atlanan KİŞİ kayıtlarını kurtar
-- (HİÇBİR ŞEYİ DEĞİŞTİRMEZ). Kurumlar hariç tutulur.
-- Sadece hâlâ kısaltma prefix'i ile başlamayan kayıtlara bakar.
-- =====================================================================
with base as (
  select
    id, name, professional_type, lower(coalesce(title,'')) as t,
    btrim(
      regexp_replace(                                   -- 5) baş/son artık noktalama
        regexp_replace(                                 -- 4) SONDAKI unvan/meslek + şehir
          regexp_replace(                               -- 3) BAŞTAKI unvan
            regexp_replace(                             -- 2) BAŞTAKI şehir
              regexp_replace(name, '\s*[|/].*$', '', 'g'), -- 1) "|" veya "/" sonrası
              '^\s*(istanbul|ankara|izmir|bursa|antalya|adana|konya|gaziantep|kocaeli|mersin|eskişehir|samsun|trabzon|kayseri|denizli|nişantaşı|kadıköy|üsküdar|şişli|bornova|karşıyaka|çankaya|fatih|bakırköy|sarıyer|maltepe|ataşehir|tuzla|gölbaşı)\s+', '', 'i'
            ),
            '^\s*((uzman|uzm|klinik|klinİk|klın|kln|psikoloğu|psikologu|psikolojik|psikolog|danışmanı|danışman|danisman|dan|psikiyatristi|psikiyatrist|psikiyatri|psikoterapist|pedagog|çocuk|genç|ergen|aile|yetişkin|terapisti|terapist|prof|doç|doc|dr|öğr|üyesi|uz|kl|psk)[\s.,:&/–-]+)+', '', 'i'
          ),
          '[\s,–-]+((uzman|uzm|klinik|klinİk|kln|psikoloğu|psikologu|psikolojik|psikolog|danışmanı|danışman|psikiyatristi|psikiyatrist|psikiyatri|psikoterapisti|psikoterapist|pedagog|çocuk|genç|ergen|aile|yetişkin|çift|terapisti|terapist|prof|doç|dr|psk|bursa|izmir|ankara|istanbul|adana)[\s.,:&/–-]*)+$', '', 'i'
        ),
        '(^[\s.,:&/–-]+)|([\s.,:&/–-]+$)', '', 'g'
      )
    ) as temiz_name
  from public.professionals
  where removed_at is null
),
person as (
  select *,
    case
      when professional_type = 'clinical_psychologist' then 'Uzm. Kln. Psk.'
      when professional_type = 'counselor'             then 'Psk. Dan.'
      when professional_type = 'family_therapist'      then 'Aile Ter.'
      when professional_type = 'psychiatrist' then
        case when t ~ 'prof' then 'Prof. Dr.' when t ~ 'do[çc]' then 'Doç. Dr.' else 'Uzm. Dr.' end
      when professional_type = 'psychologist' then
        case when t ~ 'prof' then 'Prof. Dr.' when t ~ 'do[çc]' then 'Doç. Dr.'
             when t ~ 'kl[iı]n' then 'Uzm. Kln. Psk.'
             when t ~ 'uzm(an)?\.?\s*psikolog' then 'Uzm. Psk.' else 'Psk.' end
    end as prefix
  from base
  where
    -- zaten normalize edilmiş olanları atla
    name !~ '^(Uzm\.|Psk\.|Prof\.|Doç\.|Aile Ter\.)'
    -- KURUM kelimesi içerenleri DIŞLA (bunlar kişi değil)
    and name !~* '(merkez|danışmanlık|danismanlik|enstitü|enstitu|kliniğ|klinig|akademi|platform|atölye|atolye|rehabilitasyon|eğitim|egitim|vakf|dernek|hizmet birim|tıp merkez|psikoloji$|psikoloji |koçluk|dükkan|yaşam merkez|akış|door)'
    -- temizlik sonrası 2+ kelimelik gerçek isim kalmalı (kurum kırıntısı değil)
    and temiz_name ~ '^\S+\s+\S+'
    and temiz_name !~* '(psikolog|psikiyatr|klinik|merkez|danışman|psikoloji|terapi|enstitü|uzman|pedagog)'
)
select name as eski, professional_type, prefix, temiz_name, (prefix || ' ' || temiz_name) as yeni
from person
order by professional_type, eski
limit 200;
