-- Öne çıkarma kaynağı + lansman kampanyası (sabit bitiş tarihi).
--
-- featured_source:
--   'campaign' → doğrulama karşılığı ücretsiz lansman öne çıkarması
--   'paid'     → ödeme yapan terapist (featured_until = ödenen dönemin bitişi)
--   'manual'   → admin elle verdi
--
-- Idempotent: birden fazla çalıştırılabilir.

ALTER TABLE professionals
  ADD COLUMN IF NOT EXISTS featured_source text;

ALTER TABLE professionals
  DROP CONSTRAINT IF EXISTS professionals_featured_source_check;
ALTER TABLE professionals
  ADD CONSTRAINT professionals_featured_source_check
  CHECK (featured_source IS NULL OR featured_source IN ('campaign', 'paid', 'manual'));

COMMENT ON COLUMN professionals.featured_source IS
  'Öne çıkarmanın kaynağı: campaign | paid | manual. is_featured=false ise NULL.';

-- ── Mevcut kayıtlar ──────────────────────────────────────────────────────────
-- 1) Süresiz öne çıkanlar elle verilmiş sayılır.
UPDATE professionals
SET featured_source = 'manual'
WHERE is_featured = true AND featured_until IS NULL AND featured_source IS NULL;

-- 2) Süreli olanlar (30 gün kampanyası) → kampanya; hepsi ortak lansman tarihine çekilir.
--    Süresi dolmuş olanlar da geri gelir. Tarihi değiştirmek için aşağıyı düzenle.
UPDATE professionals
SET featured_until = '2027-01-01 00:00:00+03',
    featured_source = 'campaign'
WHERE is_featured = true AND featured_until IS NOT NULL
  AND status IN ('approved', 'featured')
  AND removed_at IS NULL;

-- 3) Onaylı + doğrulanmış ama is_featured=false kalmış profiller de lansman kampanyasına alınsın
--    (doğrulama talebi onaylanmış olanlar). İstemiyorsan bu bloğu çalıştırma.
UPDATE professionals
SET is_featured = true,
    featured_until = '2027-01-01 00:00:00+03',
    featured_source = 'campaign'
WHERE is_featured = false
  AND is_verified = true
  AND status IN ('approved', 'featured')
  AND is_visible = true
  AND removed_at IS NULL;

-- Kontrol:
-- SELECT name, is_featured, featured_until, featured_source FROM professionals
-- WHERE is_featured = true ORDER BY featured_until NULLS FIRST;
