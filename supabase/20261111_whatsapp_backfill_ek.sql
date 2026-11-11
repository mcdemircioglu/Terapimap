-- Amaç: 20261111_whatsapp_backfill_gonderilenler.sql'de telefonla eşleşmeyen iki profili
--   isim eşleşmesiyle WhatsApp "gönderildi" olarak işaretlemek.
--   Excel'deki numara ile profildeki numara bir hane farklı (büyük olasılıkla yazım hatası):
--     Elida Psikoloji   Excel 5016654915 → profil 0501 655 49 15
--     Leyla Çolak Kaya  Excel 5351643545 → profil 0535 064 35 45
-- Etkilenen tablo: public.professionals (whatsapp_invited_at, whatsapp_invite_count)
-- Bağımlılık: 20261111_whatsapp_outreach.sql
-- Geri alma:
--   update public.professionals set whatsapp_invited_at = null, whatsapp_invite_count = 0
--   where id in ('2aecee16-a7bc-4f51-b0c5-559985259e4e', '6ad426b6-1f3d-4c0e-883e-6573fad5314f');

-- ÖNİZLEME (yazmaz):
select id, name, city, phone, whatsapp_invited_at
from public.professionals
where id in ('2aecee16-a7bc-4f51-b0c5-559985259e4e', '6ad426b6-1f3d-4c0e-883e-6573fad5314f');

-- UYGULAMA (zaten işaretliye dokunmaz):

