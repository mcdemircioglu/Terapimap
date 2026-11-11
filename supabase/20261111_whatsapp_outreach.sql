-- Amaç: Admin "Doğrulama Takibi" sayfası için WhatsApp doğrulama daveti takibi.
--   whatsapp_invited_at   : WhatsApp ile ilk doğrulama daveti gönderildiği an (NULL = hiç gönderilmedi)
--   whatsapp_invite_count : kaç kez WhatsApp daveti gönderildi
--   whatsapp_replied_at   : terapist WhatsApp'tan dönüş yaptı (elle işaretlenir)
-- Etkilenen tablo: public.professionals
-- Bağımlılık: professionals tablosu (schema.sql). verification_invited_at (e-posta daveti)
--   kolonu bu dosyada eklenmez; canlıda zaten mevcut olduğu varsayılır.
-- RLS: professionals'ın mevcut politikaları değişmez. Yeni kolonlar yalnızca service role
--   (admin API) ile yazılır; anon/terapist kullanıcıların bu kolonları değiştirmesi gerekmez.
-- Geri alma:
--   alter table public.professionals
--     drop column if exists whatsapp_invited_at,
--     drop column if exists whatsapp_invite_count,
--     drop column if exists whatsapp_replied_at;

alter table public.professionals
  add column if not exists whatsapp_invited_at timestamptz,
  add column if not exists whatsapp_invite_count integer not null default 0,
  add column if not exists whatsapp_replied_at timestamptz;

-- Filtreleme/sıralama için kısmi indeks (çoğu satırda NULL).
create index if not exists professionals_whatsapp_invited_at_idx
  on public.professionals (whatsapp_invited_at)
  where whatsapp_invited_at is not null;

-- Çalıştırma sonrası kontrol:
-- select column_name, data_type from information_schema.columns
--  where table_schema = 'public' and table_name = 'professionals'
--    and column_name like 'whatsapp_%';
