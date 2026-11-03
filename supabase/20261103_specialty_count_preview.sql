-- ============================================================================
-- Uzmanlık etiketi yoğunluğu: SALT OKUNUR önizleme sorguları
-- ============================================================================
-- Amaç      : Profil başına uzmanlık sayısının dağılımını ve en çok etiket
--             işaretleyen profilleri görmek. Hiçbir veriyi DEĞİŞTİRMEZ; yalnızca SELECT.
-- Etkilenen tablolar (yalnızca okunur): professionals, professional_specialties, specialties
-- Bağımlılık: professionals / professional_specialties / specialties tabloları
--             (supabase/schema dosyaları ve panel_auth_rls.sql ile kurulanlar)
-- Geri alma : Gerekmez (veri/şema değişikliği yok).
--
-- Kullanım  : Supabase SQL Editor'da her sorguyu AYRI AYRI çalıştırın.
--             Sonuçları Claude ile paylaşırsanız (satır sayısı büyükse Sorgu 2'nin ilk 50 satırı
--             ve Sorgu 1, 3 yeterli) temizlik stratejisi birlikte planlanır.
--
-- Not       : Formlardaki yeni sınır MAX_SPECIALTIES_PER_PROFILE = 10
--             (src/types/database.ts). Aşağıdaki "limit_ustu" bu eşiği kullanır.
-- ============================================================================


-- ── Sorgu 1: Profil başına uzmanlık sayısı dağılımı (yayındaki profiller) ─────
with aktif as (
  select p.id
  from public.professionals p
  where p.status in ('approved', 'featured')
    and p.is_visible = true
    and p.removed_at is null
),
sayilar as (
  select a.id, count(ps.specialty_id) as uzmanlik_sayisi
  from aktif a
  left join public.professional_specialties ps on ps.professional_id = a.id
  group by a.id
)
select
  case
    when uzmanlik_sayisi = 0  then '0'
    when uzmanlik_sayisi <= 5  then '01-05'
    when uzmanlik_sayisi <= 10 then '06-10'
    when uzmanlik_sayisi <= 15 then '11-15'
    when uzmanlik_sayisi <= 20 then '16-20'
    when uzmanlik_sayisi <= 25 then '21-25'
    else '26+'
  end as aralik,
  count(*)                                         as profil_sayisi,
  round(100.0 * count(*) / sum(count(*)) over (), 1) as yuzde
from sayilar
group by 1
order by 1;


-- ── Sorgu 2: Limitin (10) üstünde etiketi olan profiller, en çoktan aza ───────
select
  p.id,
  p.slug,
  p.name,
  p.city,
  p.status,
  count(ps.specialty_id) as uzmanlik_sayisi,
  count(ps.specialty_id) - 10 as limit_ustu
from public.professionals p
join public.professional_specialties ps on ps.professional_id = p.id
where p.status in ('approved', 'featured')
  and p.is_visible = true
  and p.removed_at is null
group by p.id, p.slug, p.name, p.city, p.status
having count(ps.specialty_id) > 10
order by uzmanlik_sayisi desc, p.name;


-- ── Sorgu 3: Uzmanlık başına profil sayısı (hangi etiketler "herkeste") ───────
select
  s.slug,
  s.name,
  s.type,
  count(*) as profil_sayisi
from public.professional_specialties ps
join public.specialties s on s.id = ps.specialty_id
join public.professionals p on p.id = ps.professional_id
where p.status in ('approved', 'featured')
  and p.is_visible = true
  and p.removed_at is null
group by s.slug, s.name, s.type
order by profil_sayisi desc;


-- ── Sorgu 4: Şehir bazında doygunluk (uzmanlık / şehirdeki profil oranı) ──────
-- %80+ oranlı kombinasyonlar şehir sayfasının neredeyse kopyasıdır.
with sehir_toplam as (
  select p.city, count(*) as toplam
  from public.professionals p
  where p.status in ('approved', 'featured')
    and p.is_visible = true
    and p.removed_at is null
  group by p.city
)
select
  p.city,
  s.slug as uzmanlik,
  count(*) as profil_sayisi,
  st.toplam as sehir_toplami,
  round(100.0 * count(*) / st.toplam, 1) as oran_yuzde
from public.professional_specialties ps
join public.professionals p on p.id = ps.professional_id
join public.specialties s on s.id = ps.specialty_id
join sehir_toplam st on st.city = p.city
where p.status in ('approved', 'featured')
  and p.is_visible = true
  and p.removed_at is null
group by p.city, s.slug, st.toplam
having count(*) >= 2
   and 100.0 * count(*) / st.toplam >= 80
order by st.toplam desc, oran_yuzde desc;
