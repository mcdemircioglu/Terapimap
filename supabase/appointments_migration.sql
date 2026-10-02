-- =====================================================================
-- Randevu Sistemi — Faz 2 (V1)
-- Supabase SQL Editor'da bir kez çalıştırın.
--
-- Kapsam:
--   1) professionals: görüşme linki (online seanslar için) ve seans
--      süresi (dakika) kolonları.
--   2) availability_rules: terapistin haftalık tekrar eden çalışma
--      saatleri ("her Pazartesi 09:00–18:00" gibi). Birden fazla satırla
--      aynı güne birden fazla aralık tanımlanabilir (ör. 09–12 ve 14–18).
--      weekday: JavaScript Date.getDay() ile aynı — 0 = Pazar … 6 = Cumartesi.
--   3) availability_exceptions: tek günlük istisnalar. is_closed = true
--      ise o gün tamamen kapalı (izin/tatil); is_closed = false ise
--      start_time/end_time ile o güne özel farklı bir çalışma saati
--      tanımlanır (haftalık kuralın yerine geçer).
--   4) appointments: onaylanmış randevu kayıtları. Danışan tarafındaki
--      rezervasyon akışı service-role istemcisiyle (bkz. leads/route.ts
--      deseni) çalışır; bu yüzden anon/authenticated için INSERT
--      politikası tanımlanmıyor — tüm yazma sunucu tarafında, çakışma
--      kontrolünden geçtikten sonra yapılır. Aynı terapist + aynı
--      başlangıç saatinde iki "confirmed" randevuyu veritabanı seviyesinde
--      de engellemek için kısmi unique index ekleniyor (çifte güvence).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) professionals: yeni kolonlar
-- ---------------------------------------------------------------------
alter table public.professionals
  add column if not exists meeting_link text,
  add column if not exists session_duration_minutes integer not null default 50;

alter table public.professionals
  drop constraint if exists professionals_session_duration_minutes_check;
alter table public.professionals
  add constraint professionals_session_duration_minutes_check
  check (session_duration_minutes > 0 and session_duration_minutes <= 240);

-- ---------------------------------------------------------------------
-- 2) availability_rules — haftalık tekrar eden program
-- ---------------------------------------------------------------------
create table if not exists public.availability_rules (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  weekday         smallint not null check (weekday between 0 and 6),
  start_time      time not null,
  end_time        time not null,
  created_at      timestamptz not null default now(),
  constraint availability_rules_time_order check (end_time > start_time),
  constraint availability_rules_unique_window unique (professional_id, weekday, start_time)
);

create index if not exists availability_rules_professional_id_idx
  on public.availability_rules (professional_id);

alter table public.availability_rules enable row level security;

drop policy if exists "professionals manage own availability rules" on public.availability_rules;
create policy "professionals manage own availability rules"
  on public.availability_rules for all
  using (
    exists (
      select 1 from public.professionals p
      where p.id = availability_rules.professional_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.professionals p
      where p.id = availability_rules.professional_id
        and p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- 3) availability_exceptions — izin günleri / tek günlük özel saatler
-- ---------------------------------------------------------------------
create table if not exists public.availability_exceptions (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  date            date not null,
  is_closed       boolean not null default true,
  start_time      time,
  end_time        time,
  note            text,
  created_at      timestamptz not null default now(),
  constraint availability_exceptions_unique_date unique (professional_id, date),
  constraint availability_exceptions_open_hours check (
    is_closed = true or (start_time is not null and end_time is not null and end_time > start_time)
  )
);

create index if not exists availability_exceptions_professional_id_idx
  on public.availability_exceptions (professional_id);
create index if not exists availability_exceptions_date_idx
  on public.availability_exceptions (date);

alter table public.availability_exceptions enable row level security;

drop policy if exists "professionals manage own availability exceptions" on public.availability_exceptions;
create policy "professionals manage own availability exceptions"
  on public.availability_exceptions for all
  using (
    exists (
      select 1 from public.professionals p
      where p.id = availability_exceptions.professional_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.professionals p
      where p.id = availability_exceptions.professional_id
        and p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- 4) appointments — onaylanmış randevu kayıtları
-- ---------------------------------------------------------------------
create table if not exists public.appointments (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  client_name     text not null,
  client_email    text not null,
  client_phone    text,
  session_type    text not null check (session_type in ('online', 'in_person')),
  start_at        timestamptz not null,
  end_at          timestamptz not null,
  status          text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  meeting_link    text,
  cancelled_at    timestamptz,
  created_at      timestamptz not null default now(),
  constraint appointments_time_order check (end_at > start_at)
);

create index if not exists appointments_professional_id_idx on public.appointments (professional_id);
create index if not exists appointments_start_at_idx        on public.appointments (start_at);

-- Aynı terapist için aynı başlangıç saatinde iki onaylı randevuyu
-- veritabanı seviyesinde de engelle (uygulama katmanındaki kontrole ek güvence).
drop index if exists appointments_no_double_booking;
create unique index appointments_no_double_booking
  on public.appointments (professional_id, start_at)
  where (status = 'confirmed');

alter table public.appointments enable row level security;

-- SELECT: terapist yalnızca kendi randevularını görür.
drop policy if exists "professionals can read own appointments" on public.appointments;
create policy "professionals can read own appointments"
  on public.appointments for select
  using (
    exists (
      select 1 from public.professionals p
      where p.id = appointments.professional_id
        and p.user_id = auth.uid()
    )
  );

-- UPDATE: terapist yalnızca kendi randevusunu iptal edebilir (satır bazlı);
-- kolon bazlı kısıt aşağıda yalnızca status/cancelled_at ile sınırlanıyor.
drop policy if exists "professionals can cancel own appointments" on public.appointments;
create policy "professionals can cancel own appointments"
  on public.appointments for update
  using (
    exists (
      select 1 from public.professionals p
      where p.id = appointments.professional_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.professionals p
      where p.id = appointments.professional_id
        and p.user_id = auth.uid()
    )
  );

revoke update on public.appointments from authenticated;
grant update (status, cancelled_at) on public.appointments to authenticated;

-- Not: INSERT politikası kasıtlı olarak tanımlanmadı — randevu oluşturma
-- yalnızca sunucu tarafında (service-role istemcisiyle, /api/appointments
-- route'u içinde, çakışma kontrolünden geçtikten sonra) yapılır.
