-- =====================================================================
-- İlçe adı temizliği
-- Filtre panelinde bozuk ilçeler görünüyordu:
--   "lüfer", "Nİlüfer", "Niüfer"  → hepsi "Nilüfer" olmalı
--   "Bursa" (ilçe alanına şehir adı yazılmış)
-- Bu kayıtlar ilçe filtresinin eşleşmemesine yol açar.
-- Önce SELECT ile kontrol edin, sonra UPDATE'leri çalıştırın.
-- =====================================================================

-- ── Kontrol: şu an hangi ilçe değerleri var? ────────────────────────
select city, district, count(*) as adet
from public.professionals
where removed_at is null
group by city, district
order by city, district;

-- ── Düzeltme: Nilüfer varyantları ──────────────────────────────────
update public.professionals
set district = 'Nilüfer'
where city = 'Bursa'
  and district in ('lüfer', 'Nİlüfer', 'Niüfer', 'nilüfer', 'NİLÜFER');

-- ── Düzeltme: ilçe alanına şehir adı yazılmış kayıtlar ─────────────
-- Bu kayıtlarda gerçek ilçe bilinmiyor; boş bırakmak filtreleri
-- yanıltmaktan daha doğrudur.
update public.professionals
set district = null
where district = city;

-- ── Son kontrol ────────────────────────────────────────────────────
select city, district, count(*) as adet
from public.professionals
where removed_at is null and city = 'Bursa'
group by city, district
order by district;
