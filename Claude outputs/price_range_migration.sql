-- =====================================================================
-- Terapimap — Seans Ücreti (price_range) alanını başvuru/doğrulama
-- taleplerine ekler.
-- `professionals.price_range` zaten vardı (ve profilde/kartlarda zaten
-- gösteriliyordu) — eksik olan, terapistin bunu Uzman Üye Ol / Profil
-- Doğrulama formlarından GİREBİLMESİYDİ. Bu talepler
-- therapist_verification_requests tablosunda tutuluyor, onda bu kolon
-- yoktu.
-- Supabase SQL Editor'de MANUEL çalıştırın. Idempotent (tekrar
-- çalıştırmak güvenli).
-- =====================================================================

alter table public.therapist_verification_requests
  add column if not exists price_range text;
