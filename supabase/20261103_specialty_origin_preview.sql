-- ============================================================================
-- Fazla uzmanlık etiketlerinin kaynağı: SALT OKUNUR önizleme sorguları
-- ============================================================================
-- Amaç      : 10'dan fazla uzmanlık etiketi olan profillerin toplu içe aktarma (import)
--             kaynaklı olup olmadığını anlamak. Etiketleri terapist mi seçti, yoksa
--             kazınmış listeden mi geldi? Hiçbir veriyi DEĞİŞTİRMEZ; yalnızca SELECT.
-- Etkilenen tablolar (yalnızca okunur): professionals, professional_specialties
-- Bağımlılık: 20261103_specialty_count_preview.sql ile aynı tablolar;
--             professionals.user_id (panel_auth_rls.sql), is_verified, created_at
-- Geri alma : Gerekmez (veri/şema değişikliği yok).
--
-- Kullanım  : Supabase SQL Editor'da her sorguyu AYRI AYRI çalıştırın ve sonuçları
--             (Sorgu 1, 2, 3) paylaşın. Editör varsayılan olarak 100 satırla sınırlar;
--             bu sorgular özet döndürdüğü için sınırı aşmaz.
-- ============================================================================


-- ── Sorgu 1: Etiket sayısı kümesine göre sahiplenme / doğrulama durumu ─────────
-- "sahiplenmis" = bir terapist hesabına bağlı (user_id dolu); bu profillerde etiketleri
-- büyük olasılıkla terapist seçmiştir. "dogrulanmis" = is_verified.
with aktif as (
  select p.id, p.user_id, p.is_verified, p.created_at,
         (select count(*) from public.professional_specialties ps where ps.professional_id = p.id) as n
  from public.professionals p
  where p.status in ('approved', 'featured')
    and p.is_visible = true
    and p.removed_at is null
)
select
  case when n <= 10 then '1) 0-10' when n <= 25 then '2) 11-25' else '3) 26+' end as kume,
  (user_id is not null)  as sahiplenmis,
  is_verified            as dogrulanmis,
  count(*)               as profil_sayisi
from aktif
group by 1, 2, 3
order by 1, 2, 3;


-- ── Sorgu 2: 26+ etiketli profiller kayıt tarihine göre (toplu içe aktarma izi) ─
-- Aynı gün/saat dilimine yığılma, tek bir import partisini gösterir.



-- ── Sorgu 3: Şehir başına 26+ etiketli profil sayısı ve payı ──────────────────
with aktif as (
  select p.id, p.city,
         (select count(*) from public.professional_specialties ps where ps.professional_id = p.id) as n
  from public.professionals p
  where p.status in ('approved', 'featured')
    and p.is_visible = true
    and p.removed_at is null
)
select
  city,
  count(*)                                             as toplam,
  count(*) filter (where n >= 26)                      as uzmanlik_26_ustu,
  round(100.0 * count(*) filter (where n >= 26) / count(*), 1) as pay_yuzde
from aktif
group by city
having count(*) >= 5
order by pay_yuzde desc, toplam desc;
