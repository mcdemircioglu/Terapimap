-- =====================================================================
-- Psikoloji Rehberi — makale kapak görselleri
-- Görseller public/rehber/ altında statik dosya olarak servis edilir,
-- bu yüzden Supabase storage veya remote image ayarı gerekmez.
-- Supabase SQL Editor'de çalıştırın. Tekrar çalıştırmak güvenlidir.
-- =====================================================================

update public.articles as a
set cover_image_url = v.url
from (values
  ('ilk-terapi-seansinda-ne-olur', '/rehber/ilk-terapi-seansinda-ne-olur.png'),
  ('terapi-ucretleri-2026', '/rehber/terapi-ucretleri-2026.png'),
  ('dogru-terapisti-nasil-secersiniz', '/rehber/dogru-terapisti-nasil-secersiniz.png'),
  ('psikolog-psikiyatrist-klinik-psikolog-farki', '/rehber/psikolog-psikiyatrist-klinik-psikolog-farki.png'),
  ('terapi-ne-kadar-surer', '/rehber/terapi-ne-kadar-surer.png'),
  ('online-terapi-etkili-mi', '/rehber/online-terapi-etkili-mi.png'),
  ('anksiyete-bozuklugu-nedir', '/rehber/anksiyete-bozuklugu-nedir.png'),
  ('depresyon-belirtileri', '/rehber/depresyon-belirtileri.png'),
  ('panik-atak-aninda-ne-yapmali', '/rehber/panik-atak-aninda-ne-yapmali.png'),
  ('bilissel-davranisci-terapi-bdt-nedir', '/rehber/bilissel-davranisci-terapi-bdt-nedir.png'),
  ('emdr-terapisi-nedir', '/rehber/emdr-terapisi-nedir.png'),
  ('sema-terapi-nedir', '/rehber/sema-terapi-nedir.png'),
  ('cocuk-icin-psikolog-secimi', '/rehber/cocuk-icin-psikolog-secimi.png'),
  ('ergenlik-doneminde-ruh-sagligi', '/rehber/ergenlik-doneminde-ruh-sagligi.png'),
  ('cocuklarda-sinav-kaygisi', '/rehber/cocuklarda-sinav-kaygisi.png'),
  ('cift-terapisi-nedir', '/rehber/cift-terapisi-nedir.png')
) as v(slug, url)
where a.slug = v.slug;

-- Kontrol: 16 satırda cover_image_url dolu olmalı
select slug, cover_image_url from public.articles order by published_at desc;
