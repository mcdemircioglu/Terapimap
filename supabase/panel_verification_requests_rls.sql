-- =====================================================================
-- Faz 1 / Adım 4: Panelden gönderilen profil güncelleme taleplerinin
-- durumunu terapistin görebilmesi için RLS.
-- Supabase SQL Editor'da bir kez çalıştırın.
--
-- therapist_verification_requests tablosunda bugüne kadar yalnızca
-- "anyone can submit a verification request" (INSERT) politikası vardı;
-- SELECT service-role dışında tamamen kapalıydı. Bu, terapistin panelden
-- kendi talebinin durumunu (Bekliyor/Onaylandı/Reddedildi) görmesini
-- engelliyordu. Aşağıdaki politika SADECE kendi professional_id'sine ait
-- talepleri okumaya izin verir.
-- =====================================================================

drop policy if exists "professionals can read own requests" on public.therapist_verification_requests;
create policy "professionals can read own requests"
  on public.therapist_verification_requests for select
  using (
    exists (
      select 1 from public.professionals p
      where p.id = therapist_verification_requests.professional_id
        and p.user_id = auth.uid()
    )
  );
