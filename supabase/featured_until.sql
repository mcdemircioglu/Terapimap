-- Kampanya: "profilini doğrulayana 30 gün ücretsiz öne çıkarma" altyapısı.
--
-- featured_until: öne çıkarmanın (is_featured) bitiş zamanı.
--   NULL  → kalıcı öne çıkarma (admin manuel) — süresiz.
--   tarih → süreli öne çıkarma; tarih geçince uygulama profili artık
--           "öne çıkan" saymaz (okuma anında filtrelenir, cron gerekmez).
--
-- Idempotent: birden fazla çalıştırılabilir.

ALTER TABLE professionals
  ADD COLUMN IF NOT EXISTS featured_until timestamptz;

COMMENT ON COLUMN professionals.featured_until IS
  'Öne çıkarma bitiş zamanı. NULL = süresiz (kalıcı). Tarih geçince profil öne çıkan sayılmaz.';

-- Aktif öne çıkanları hızlı süzmek için kısmi index (opsiyonel ama faydalı).
CREATE INDEX IF NOT EXISTS idx_professionals_featured_active
  ON professionals (featured_until)
  WHERE is_featured = true;
