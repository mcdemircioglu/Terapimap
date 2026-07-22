-- =====================================================================
-- TEŞHİS 2 — professional_type + title kombinasyon dağılımı
-- Tek sorgu; SQL Editor sonucu gösterir. Çıktıyı paylaşın.
-- =====================================================================
select
  professional_type,
  lower(btrim(coalesce(title, '(boş)'))) as title_normalize,
  count(*) as adet
from public.professionals
where removed_at is null
group by professional_type, lower(btrim(coalesce(title, '(boş)')))
order by professional_type, adet desc;
