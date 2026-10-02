-- =====================================================================
-- Randevu Onay Akışı — "pending" durumu
-- Supabase SQL Editor'da bir kez çalıştırın (appointments_migration.sql'den
-- SONRA).
--
-- Kapsam: Danışan bir saat seçtiğinde randevu artık ANINDA "confirmed"
-- olmuyor; terapist panelden "Kabul Et" demeden "pending" (onay bekliyor)
-- durumunda kalıyor. Terapist "İptal Et" derse (pending veya confirmed
-- fark etmez) status 'cancelled' olur.
--
--   pending   → danışan saati seçti, terapist henüz onaylamadı
--   confirmed → terapist onayladı, randevu kesin
--   cancelled → terapist reddetti/iptal etti
--
-- pending durumundaki bir randevu da aynı saati "meşgul" tutmalı (aksi
-- halde onay bekleyen bir saat başka bir danışana da gösterilir) — bu
-- yüzden "iki kişi aynı saati almasın" kısıtı artık yalnızca confirmed
-- değil, cancelled OLMAYAN her şeyi kapsıyor.
-- =====================================================================

alter table public.appointments
  drop constraint if exists appointments_status_check;
alter table public.appointments
  add constraint appointments_status_check
  check (status in ('pending', 'confirmed', 'cancelled'));

alter table public.appointments
  alter column status set default 'pending';

drop index if exists appointments_no_double_booking;
create unique index appointments_no_double_booking
  on public.appointments (professional_id, start_at)
  where (status <> 'cancelled');
