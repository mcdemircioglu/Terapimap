-- Amaç: Numarayı engellediği için Excel'de numarası olmayan "elif guran" kaydını
--   isim eşleşmesiyle (Uzm.Psk.Dan. Elif Güran, Ankara) WhatsApp "gönderildi" işaretlemek.
-- Etkilenen tablo: public.professionals (whatsapp_invited_at, whatsapp_invite_count)
-- Bağımlılık: 20261111_whatsapp_outreach.sql
-- Geri alma:
--   update public.professionals set whatsapp_invited_at = null, whatsapp_invite_count = 0
--   where id = '82093477-7818-4c34-b47b-99dfddd5e83b';

-- ÖNİZLEME (yazmaz):
select id, name, city, phone, status, whatsapp_invited_at
from public.professionals
where id = '82093477-7818-4c34-b47b-99dfddd5e83b';

-- UYGULAMA (zaten işaretliye dokunmaz):
update public.professionals
set whatsapp_invited_at   = coalesce(whatsapp_invited_at, now()),
    whatsapp_invite_count = greatest(whatsapp_invite_count, 1)
where id = '82093477-7818-4c34-b47b-99dfddd5e83b';
