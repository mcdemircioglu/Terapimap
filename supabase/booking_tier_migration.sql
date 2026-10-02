-- Item 4: "Mesaj At" butonu + geçici paket seviyesi (booking_tier).
--
-- Gerçek ücret paketi/ödeme sistemi kurulana kadar bu alan admin panelinden
-- elle yönetilir (bkz. Terapimap Paket Sistemi Tasarımı dokümanı). Üç değer:
--   - 'none'   : panelde kayıtlı ama ücretli paket almamış
--   - 'level1' : ücretli, temel paket — sadece iletişim formu
--   - 'full'   : ücretli, tam paket — anında randevu takvimi aktif
--
-- Varsayılan 'full': randevu sistemi V1 zaten canlıda ve bazı terapistler
-- müsaitliklerini tanımlayıp kullanıyor — bu alanı eklemek onların akışını
-- bozmamalı. Admin, paket almayan/level1'e düşürülecek terapistleri panelden
-- elle 'level1' veya 'none' yapabilir.
alter table public.professionals
  add column if not exists booking_tier text not null default 'full';

alter table public.professionals
  drop constraint if exists professionals_booking_tier_check;

alter table public.professionals
  add constraint professionals_booking_tier_check
  check (booking_tier in ('none', 'level1', 'full'));

comment on column public.professionals.booking_tier is
  'Geçici admin anahtarı — gerçek paket/ödeme sistemi kurulana kadar randevu takviminin (full) mi yoksa sadece iletişim formunun mu (none/level1) gösterileceğini belirler.';
