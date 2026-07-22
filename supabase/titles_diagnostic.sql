-- =====================================================================
-- TEŞHİS — unvan normalizasyonu öncesi veri dağılımı
-- Supabase SQL Editor'de çalıştırın, ÇIKTIYI paylaşın.
-- Hiçbir şeyi değiştirmez; yalnızca okur.
-- =====================================================================

-- 1) professional_type dağılımı
select professional_type, count(*) as adet
from public.professionals
where removed_at is null
group by professional_type
order by adet desc;

-- 2) title alanındaki farklı değerler (en sık 40)
select title, count(*) as adet
from public.professionals
where removed_at is null
group by title
order by adet desc
limit 40;

-- 3) İsimlerinde zaten unvan/şehir geçen kayıtlardan örnekler
--    (temizlik kapsamını görmek için)
select name, title, professional_type
from public.professionals
where removed_at is null
  and (
    name ~* '(psikolog|psikiyatr|klinik|uzman|uzm\.?|dr\.?|prof|danış|psk\.?|kln\.?|dan\.?)'
    or name ~ '\|'
    or name ~* '(istanbul|ankara|izmir|bursa|antalya|adana|konya|gaziantep|kocaeli|mersin|eskişehir|samsun|trabzon|kayseri|denizli)'
  )
order by name
limit 60;

-- 4) İsminde HİÇ unvan geçmeyen "temiz" örnekler
select name, title, professional_type
from public.professionals
where removed_at is null
  and name !~* '(psikolog|psikiyatr|klinik|uzman|uzm\.?|dr\.?|prof|danış|psk\.?|kln\.?|dan\.?)'
  and name !~ '\|'
order by name
limit 20;

-- 5) title BOŞ ama professional_type dolu olan kaç kayıt var?
select
  count(*) filter (where (title is null or btrim(title) = '')) as title_bos,
  count(*) filter (where professional_type is null) as type_bos,
  count(*) as toplam
from public.professionals
where removed_at is null;
