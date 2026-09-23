-- Testler hub sayfasındaki kartlar için opsiyonel kapak görseli.
-- Boş bırakılırsa kart ikon + pastel arka plan fallback'i gösterir.
-- İleride sadece bu alanı (Supabase'den) güncelleyerek kod değişikliği/deploy
-- yapmadan test kapaklarını yenileyebiliriz.
alter table public.psychology_tests
  add column if not exists cover_image_url text;
