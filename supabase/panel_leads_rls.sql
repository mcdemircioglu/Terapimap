-- =====================================================================
-- Faz 1 / Adım 6: Panel — Talepler modülü.
-- Supabase SQL Editor'da bir kez çalıştırın.
--
-- Kapsam:
--   1) leads.therapist_contacted_at: terapistin "iletişime geçtim"
--      onayını tuttuğumuz yeni kolon (admin'in sent_at/status alanlarına
--      dokunmuyor, ayrı ve geriye dönük uyumlu).
--   2) Adım 2'deki "professionals can read own leads" politikası terapistin
--      TÜM taleplerini gösteriyordu — admin henüz onaylamadan/göndermeden
--      önceki (moderasyon bekleyen) talepler de dahil. Bunu, yalnızca
--      admin'in onaylayıp gönderdiği (sent_at dolu) taleplerle
--      sınırlıyoruz — moderasyon kapısı böylece veritabanı seviyesinde de
--      korunmuş olur.
--   3) Terapistin YALNIZCA therapist_contacted_at kolonunu, yalnızca
--      kendi gönderilmiş talepleri üzerinde güncelleyebilmesi için satır +
--      kolon bazlı yetki (Adım 2'deki professionals deseniyle aynı).
-- =====================================================================

alter table public.leads
  add column if not exists therapist_contacted_at timestamptz;

-- ---------------------------------------------------------------------
-- SELECT: yalnızca admin'in gönderdiği (sent_at dolu) kendi talepleri
-- ---------------------------------------------------------------------
drop policy if exists "professionals can read own leads" on public.leads;
drop policy if exists "professionals can read own sent leads" on public.leads;
create policy "professionals can read own sent leads"
  on public.leads for select
  using (
    sent_at is not null
    and exists (
      select 1 from public.professionals p
      where p.id = leads.professional_id
        and p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- UPDATE: yalnızca kendi gönderilmiş taleplerinde (satır bazlı)
-- ---------------------------------------------------------------------
drop policy if exists "professionals can mark own leads contacted" on public.leads;
create policy "professionals can mark own leads contacted"
  on public.leads for update
  using (
    sent_at is not null
    and exists (
      select 1 from public.professionals p
      where p.id = leads.professional_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.professionals p
      where p.id = leads.professional_id
        and p.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- UPDATE: yalnızca therapist_contacted_at kolonu (kolon bazlı)
-- ---------------------------------------------------------------------
revoke update on public.leads from authenticated;
grant update (therapist_contacted_at) on public.leads to authenticated;
