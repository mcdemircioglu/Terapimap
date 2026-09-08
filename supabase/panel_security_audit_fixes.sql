-- =====================================================================
-- Faz 1 / Adım 9: Güvenlik/RLS doğrulama denetiminde bulunan ve
-- canlı veritabanında düzeltilen iki kayıt. Bu dosya yalnızca
-- dokümantasyon amaçlıdır — her iki komut da Supabase SQL Editor'de
-- zaten çalıştırılmış ve doğrulanmıştır.
-- =====================================================================

-- 1) KRİTİK: professionals tablosunda, muhtemelen ilk kurulumdan kalma
--    "Public read professionals" adında ayrı bir SELECT policy'si vardı
--    (qual = true — hiçbir kısıtlama yok). Bu policy, bizim eklediğimiz
--    "professionals are publicly readable" (status/is_visible/removed_at
--    kontrollü) policy'sini fiilen devre dışı bırakıyordu: RLS'te
--    permissive policy'ler OR'lanır, en gevşek olan kazanır. Sonuç:
--    onaylanmamış/pasif/silinmiş profiller ve email/phone/user_id gibi
--    hassas kolonlar herkese (giriş yapmamış ziyaretçiler dahil) açıktı.
drop policy if exists "Public read professionals" on public.professionals;

-- 2) therapist_verification_requests tablosunda authenticated rolüne
--    tablo seviyesinde UPDATE izni açık duruyordu ama hiçbir UPDATE
--    policy'si tanımlı değildi. RLS açık olduğu için pratikte işlemiyor
--    olsa da (policy yoksa varsayılan red), gereksiz bir yetkiydi;
--    professionals/leads'teki revoke deseniyle tutarlı hale getirildi.
revoke update on public.therapist_verification_requests from authenticated;
