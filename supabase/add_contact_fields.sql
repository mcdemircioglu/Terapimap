-- =====================================================================
-- Migration: professionals tablosuna iletişim ve konum alanları ekle
-- Supabase SQL Editor'da çalıştır
-- =====================================================================

alter table public.professionals
  add column if not exists clinic_name    text,
  add column if not exists address        text,
  add column if not exists google_maps_url text,
  add column if not exists phone          text,
  add column if not exists email          text,
  add column if not exists website_url    text,
  add column if not exists instagram_url  text;
