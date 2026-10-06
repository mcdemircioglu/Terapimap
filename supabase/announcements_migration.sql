-- =====================================================================
-- Terapimap — Terapist Duyuruları (Etkinlik / Eğitim / İş İlanı)
-- Supabase SQL Editor'da bir kez çalıştırın. İdempotenttir.
--
-- Kapsam:
--   1) announcements: panelden terapistin oluşturduğu duyuru — blog
--      (articles) ile BİREBİR AYNI durum makinesi: draft (terapist
--      düzenliyor) → pending (incelemede) → published (yayında) /
--      rejected (admin reddetti, admin_note'ta gerekçe). "Duyuru Aç"
--      özelliği yalnızca booking_tier='full' olan terapistlerde panelde
--      aktif olur (uygulama tarafında kontrol edilir — bkz.
--      /panel/duyurular ve ilgili API route'ları); bu kısıt burada bir
--      DB kısıtı olarak tekrar edilmiyor, randevu takviminde olduğu gibi
--      yalnızca uygulama katmanında.
--   2) announcement_registrations: "Kayıt Ol" formundan gelen danışan
--      bilgileri. leads'ten FARKLI olarak admin onayı YOK — doğrudan
--      ilgili terapistin panelindeki "Duyurularım" bölümünde görünür.
--      Hem public insert hem panel/admin okuma uygulama katmanında
--      (service-role route'lar) yapılır, bu yüzden RLS'de yazma/okuma
--      politikası tanımlanmıyor — varsayılan kapalı (yalnızca
--      service-role erişebilir), articles tablosundaki "yazma politikası
--      bilinçli olarak yok" deseniyle aynı.
-- =====================================================================

create table if not exists public.announcements (
  id              uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.professionals(id) on delete cascade,
  type            text not null check (type in ('etkinlik', 'egitim', 'is_ilani')),
  title           text not null,
  description     text not null,
  location_text   text,
  is_online       boolean not null default false,
  -- Serbest metin — "Her Cumartesi 14:00", "Başvurular açık" gibi; yapısal
  -- bir tarih/saat zorunlu kılınmıyor çünkü eğitim/iş ilanı türlerinde
  -- net bir randevu saati olmayabilir.
  time_label      text,
  capacity        integer check (capacity is null or capacity > 0),
  price_info      text,
  image_url       text,
  status          text not null default 'draft'
                    check (status in ('draft', 'pending', 'published', 'rejected')),
  admin_note      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists announcements_professional_id_idx on public.announcements (professional_id);
create index if not exists announcements_status_idx          on public.announcements (status);
create index if not exists announcements_type_idx             on public.announcements (type);
create index if not exists announcements_status_type_idx      on public.announcements (status, type);
create index if not exists announcements_created_at_idx       on public.announcements (created_at desc);

drop trigger if exists announcements_set_updated_at on public.announcements;
create trigger announcements_set_updated_at
  before update on public.announcements
  for each row execute function public.set_updated_at();

alter table public.announcements enable row level security;

-- Public tarafta yalnızca yayınlanmış duyurular okunabilir (/duyurular
-- sayfası anon client ile sorgular — reviews/articles ile aynı desen).
drop policy if exists "published announcements are publicly readable" on public.announcements;
create policy "published announcements are publicly readable"
  on public.announcements
  for select
  using (status = 'published');

-- Yazma politikası bilinçli olarak YOK: panel/admin route'ları
-- service-role ile yazıyor (oturum/parola doğrulaması route içinde).

-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.announcement_registrations (
  id              uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  -- Terapistin panelde "kendi duyurularına gelen kayıtlar" sorgusunu
  -- announcement_id join'i olmadan da hızlıca filtreleyebilmesi için
  -- denormalize edilmiş (leads.professional_id ile aynı mantık).
  professional_id uuid not null references public.professionals(id) on delete cascade,
  name            text not null,
  email           text not null,
  phone           text,
  message         text,
  created_at      timestamptz not null default now()
);

create index if not exists announcement_registrations_announcement_id_idx
  on public.announcement_registrations (announcement_id);
create index if not exists announcement_registrations_professional_id_idx
  on public.announcement_registrations (professional_id);
create index if not exists announcement_registrations_created_at_idx
  on public.announcement_registrations (created_at desc);

alter table public.announcement_registrations enable row level security;
-- Yazma/okuma politikası yok — public gönderim ve panel okuması
-- service-role route'ları üzerinden yapılıyor (varsayılan: tamamen kapalı).
