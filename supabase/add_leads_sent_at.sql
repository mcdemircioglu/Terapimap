-- Lead'in terapiste mail olarak iletildiği zamanı tutar.
-- Supabase SQL Editor'de bir kez çalıştırın.
alter table public.leads
  add column if not exists sent_at timestamptz;

comment on column public.leads.sent_at is
  'Admin onayıyla terapiste e-posta gönderildiği an. NULL = henüz gönderilmedi.';
