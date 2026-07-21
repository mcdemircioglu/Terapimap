-- =====================================================================
-- Veri temizliği — Türkçe karakter bozulmaları ve ilçe adları
--
-- Teşhis sorgularında ortaya çıkan iki sorun:
--   1) İsimlerde küçük "ş/ğ" harfleri "Ş/Ğ" olmuş:
--      AyŞegül → Ayşegül, TuĞba → Tuğba, BektaŞ → Bektaş, KöseoĞlu → Köseoğlu
--   2) İlçe adları tutarsız: Nilüfer / Nİlüfer / Niüfer / lüfer
--      ve bazı kayıtlarda ilçe alanına şehir adı yazılmış.
--
-- HER BÖLÜM ÖNCE "KONTROL" SORGUSU İÇERİR.
-- Önce kontrolü çalıştırıp sonucu görün, sonra UPDATE'i çalıştırın.
-- =====================================================================


-- ─────────────────────────────────────────────────────────────────────
-- BÖLÜM 1: İlçe adları
-- ─────────────────────────────────────────────────────────────────────

-- KONTROL: mevcut ilçe dağılımı
select city, district, count(*) as adet
from public.professionals
where removed_at is null
group by city, district
order by city, adet desc;

-- DÜZELTME 1a: Nilüfer varyantları
update public.professionals
set district = 'Nilüfer'
where city = 'Bursa'
  and district is not null
  and district <> 'Nilüfer'
  and (
    district ilike '%lüfer%'
    or district ilike '%lufer%'
  );

-- DÜZELTME 1b: ilçe alanına şehir adı yazılmış kayıtlar
-- (gerçek ilçe bilinmiyor; boş bırakmak filtreyi yanıltmaktan iyidir)
update public.professionals
set district = null
where district = city;

-- DÜZELTME 1c: baştaki/sondaki boşluklar
update public.professionals
set district = btrim(district)
where district <> btrim(district);


-- ─────────────────────────────────────────────────────────────────────
-- BÖLÜM 2: İsimlerdeki Ş/Ğ bozulması
--
-- Kural: küçük harften HEMEN SONRA gelen büyük Ş/Ğ bozulmadır.
--   "AyŞegül"  → y'den sonra Ş  → bozuk  ✔ düzeltilir
--   "ÖZDEMİR"  → Z'den sonra... → tamamı büyük, dokunulmaz
-- ─────────────────────────────────────────────────────────────────────

-- KONTROL: hangi isimler değişecek? (önce bunu çalıştırıp listeyi görün)
select
  name as mevcut,
  regexp_replace(
    regexp_replace(name, '([a-zçğıiöşü])Ş', '\1ş', 'g'),
    '([a-zçğıiöşü])Ğ', '\1ğ', 'g'
  ) as duzeltilmis
from public.professionals
where removed_at is null
  and name ~ '[a-zçğıiöşü][ŞĞ]'
order by name;

-- DÜZELTME 2a: professionals.name
update public.professionals
set name = regexp_replace(
             regexp_replace(name, '([a-zçğıiöşü])Ş', '\1ş', 'g'),
             '([a-zçğıiöşü])Ğ', '\1ğ', 'g'
           )
where name ~ '[a-zçğıiöşü][ŞĞ]';

-- DÜZELTME 2b: aynı bozulma title alanında da olabilir
update public.professionals
set title = regexp_replace(
              regexp_replace(title, '([a-zçğıiöşü])Ş', '\1ş', 'g'),
              '([a-zçğıiöşü])Ğ', '\1ğ', 'g'
            )
where title ~ '[a-zçğıiöşü][ŞĞ]';

-- DÜZELTME 2c: clinic_name ve about alanları
update public.professionals
set clinic_name = regexp_replace(
                    regexp_replace(clinic_name, '([a-zçğıiöşü])Ş', '\1ş', 'g'),
                    '([a-zçğıiöşü])Ğ', '\1ğ', 'g'
                  )
where clinic_name ~ '[a-zçğıiöşü][ŞĞ]';

update public.professionals
set about = regexp_replace(
              regexp_replace(about, '([a-zçğıiöşü])Ş', '\1ş', 'g'),
              '([a-zçğıiöşü])Ğ', '\1ğ', 'g'
            )
where about ~ '[a-zçğıiöşü][ŞĞ]';


-- ─────────────────────────────────────────────────────────────────────
-- BÖLÜM 3: Son kontrol
-- ─────────────────────────────────────────────────────────────────────
select city, district, count(*) as adet
from public.professionals
where removed_at is null and city = 'Bursa'
group by city, district
order by adet desc;

select count(*) as kalan_bozuk_isim
from public.professionals
where removed_at is null and name ~ '[a-zçğıiöşü][ŞĞ]';
