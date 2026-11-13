-- Amaç: Google Search Console (GSC) verisini terapist bazında saklamak. Admin
--   "Doğrulama Takibi" sayfasındaki WhatsApp davet mesajı bu rakamlarla kişiselleştirilir.
--   Veri, panelden CSV yüklenerek (api/admin/gsc-stats) yazılır; her yüklemede önceki
--   dönemin satırları yenisiyle değiştirilir (tek anlık görüntü).
-- Etkilenen tablolar: public.professional_gsc_stats (yeni)
-- Bağımlılık: public.professionals (schema.sql)
-- RLS: Açık ve bilerek politikasız bırakıldı. Bu tablo yalnızca service role ile
--   (admin API) okunup yazılır; anon ve terapist kullanıcıların erişimi olmamalı.
-- Geri alma:
--   drop table if exists public.professional_gsc_stats;

create table if not exists public.professional_gsc_stats (
  professional_id   uuid primary key references public.professionals(id) on delete cascade,
  period_start      date not null,
  period_end        date not null,
  impressions       integer not null default 0 check (impressions >= 0),
  clicks            integer not null default 0 check (clicks >= 0),
  avg_position      numeric(5,1),
  brand_impressions integer not null default 0 check (brand_impressions >= 0),
  brand_clicks      integer not null default 0 check (brand_clicks >= 0),
  top_query         text,
  updated_at        timestamptz not null default now()
);

alter table public.professional_gsc_stats enable row level security;

-- Çalıştırma sonrası kontrol:
-- select count(*) from public.professional_gsc_stats;  -- 0 dönmeli (henüz veri yok)
