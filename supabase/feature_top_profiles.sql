-- Ana sayfa "Öne Çıkan Terapistler" bölümünü doldurmak için en kaliteli
-- profilleri KALICI öne çıkarır (featured_until = NULL → süresiz, kampanyayla
-- çakışmaz). Ana sayfa 6 tane gösteriyor; buradaki LIMIT'i istediğin gibi ayarla.
--
-- Öncelik sırası: fotoğrafı olanlar → doğrulanmışlar → yüksek puan → daha deneyimli.

-- ── 1) ÖNCE ÖNİZLE: kimler öne çıkacak? (sadece okur, değiştirmez) ──────────
SELECT id, name, city, is_verified, rating, experience_years,
       (image_url IS NOT NULL AND image_url <> '') AS foto_var
FROM professionals
WHERE status IN ('approved', 'featured')
  AND is_visible = true
  AND removed_at IS NULL
ORDER BY (image_url IS NOT NULL AND image_url <> '') DESC,
         is_verified DESC,
         rating DESC NULLS LAST,
         experience_years DESC NULLS LAST
LIMIT 6;

-- ── 2) Listeyi beğendiysen UYGULA (yukarıdaki seçimi öne çıkarır) ───────────
-- Not: önce mevcut kalıcı öne çıkarmaları sıfırlamak istersen alttaki satırı aç:
-- UPDATE professionals SET is_featured = false WHERE is_featured = true AND featured_until IS NULL;

UPDATE professionals
SET is_featured = true, featured_until = NULL
WHERE id IN (
  SELECT id FROM professionals
  WHERE status IN ('approved', 'featured')
    AND is_visible = true
    AND removed_at IS NULL
  ORDER BY (image_url IS NOT NULL AND image_url <> '') DESC,
           is_verified DESC,
           rating DESC NULLS LAST,
           experience_years DESC NULLS LAST
  LIMIT 6
);
