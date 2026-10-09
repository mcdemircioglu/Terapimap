-- =====================================================================
-- admin_update_professional — terapist güncellemesini TEK transaction'da yapar
--
-- Neden: PUT /api/admin/professionals/[id] önceden 3 ayrı istek yapıyordu:
--   1) professionals satırını güncelle
--   2) professional_specialties satırlarını sil
--   3) yeni uzmanlıkları ekle
-- 3. adım hata verirse (ör. geçersiz uzmanlık id'si) 2. adım zaten commit
-- olduğu için terapist TÜM uzmanlıklarını kaybediyordu. Bu fonksiyon üçünü
-- tek transaction'da çalıştırır: bir adım patlarsa hepsi geri alınır.
--
-- Güvenlik:
--  * Yalnızca service_role çağırabilir (anon/authenticated yetkisi alınır);
--    zaten yalnızca admin API rotasından (service key) çağrılıyor.
--  * Alan adları professionals tablosunun gerçek kolonlarına karşı doğrulanır
--    ve quote_ident ile alıntılanır; id/created_at değiştirilemez.
--
-- Uygulama: Supabase → SQL Editor'da bir kez çalıştırın. Çalıştırılmadan da
-- site çalışır (kod, fonksiyon yoksa eski 3 adımlı yola düşer).
-- =====================================================================

create or replace function public.admin_update_professional(
  p_id uuid,
  p_fields jsonb,
  p_specialty_ids uuid[]
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_fields  jsonb := coalesce(p_fields, '{}'::jsonb);
  v_unknown text;
  v_cols    text;
  v_updated integer := 0;
begin
  if not exists (select 1 from public.professionals where id = p_id) then
    raise exception 'Profesyonel bulunamadı.' using errcode = 'P0002';
  end if;

  -- Bilinmeyen veya değiştirilemez alanlar → hata (PostgREST'in "bilinmeyen
  -- kolon" davranışıyla uyumlu; sessizce yok sayılmaz).
  select string_agg(k, ', ') into v_unknown
  from jsonb_object_keys(v_fields) as k
  where k in ('id', 'created_at')
     or not exists (
       select 1 from information_schema.columns c
       where c.table_schema = 'public'
         and c.table_name = 'professionals'
         and c.column_name = k
     );

  if v_unknown is not null then
    raise exception 'Geçersiz alan(lar): %', v_unknown using errcode = '22023';
  end if;

  select string_agg(quote_ident(k), ', ') into v_cols
  from jsonb_object_keys(v_fields) as k;

  if v_cols is not null then
    execute format(
      'update public.professionals
          set (%1$s) = (select %1$s from jsonb_populate_record(null::public.professionals, $1))
        where id = $2',
      v_cols
    ) using v_fields, p_id;
    get diagnostics v_updated = row_count;
  end if;

  -- Uzmanlıkları değiştir (aynı transaction): sil → ekle.
  delete from public.professional_specialties where professional_id = p_id;

  if coalesce(array_length(p_specialty_ids, 1), 0) > 0 then
    insert into public.professional_specialties (professional_id, specialty_id)
    select p_id, s from unnest(p_specialty_ids) as s group by s;
  end if;

  return v_updated;
end;
$$;

revoke all on function public.admin_update_professional(uuid, jsonb, uuid[]) from public, anon, authenticated;
grant execute on function public.admin_update_professional(uuid, jsonb, uuid[]) to service_role;

-- PostgREST şema önbelleğini hemen yenile (fonksiyon anında çağrılabilsin).
notify pgrst, 'reload schema';
