-- ─────────────────────────────────────────────────────────────────────
-- Faz 1 devamı: Terapist Blog Alanı.
--
-- Terapistler panelden kendi makalelerini yazıp admin onayına
-- gönderebilir; admin onaylayınca Psikoloji Rehberi'nde (mevcut
-- `articles` tablosu/akışı) yayınlanır. Admin-yazarlı içerik akışına
-- (professional_id NULL) dokunmuyoruz — yalnızca genişletiyoruz.
--
-- Durum makinesi: draft (terapist düzenliyor, kimseye görünmez) →

-- pending (incelemeye gönderildi, admin onayını bekliyor) → published
-- (yayında) veya rejected (admin reddetti, admin_note'ta gerekçe,
-- terapist düzenleyip tekrar pending'e gönderebilir).
--
-- Not: published bir yazıyı terapist tekrar düzenlerse (ürün kararı)
-- değişiklik ANINDA yayına yansır — status 'published' kalır, yeniden
-- onay gerekmez. Yalnızca ilk yayına giriş admin onayı gerektirir.
-- ─────────────────────────────────────────────────────────────────────

alter table public.articles
  add column if not exists professional_id uuid references public.professionals(id) on delete set null;

alter table public.articles
  add column if not exists admin_note text;

-- status check constraint'ini genişlet (draft/published → draft/pending/published/rejected)
alter table public.articles drop constraint if exists articles_status_check;
alter table public.articles
  add constraint articles_status_check
  check (status in ('draft', 'pending', 'published', 'rejected'));

create index if not exists articles_professional_id_idx
  on public.articles (professional_id);

-- Admin'in "incelemeyi bekleyenler" listesini hızlı çekebilmesi için.
create index if not exists articles_status_idx
  on public.articles (status);

-- RLS zaten "status = 'published'" şartıyla herkese açık okuma sağlıyor
-- (articles_migration.sql) — pending/draft/rejected hâlâ yalnızca
-- service-role ile görülebilir, ek bir değişiklik gerekmiyor. Panel
-- route'ları (upload-photo/upload-document ile aynı desen) oturumu
-- route içinde doğrulayıp service-role ile yazıyor.
