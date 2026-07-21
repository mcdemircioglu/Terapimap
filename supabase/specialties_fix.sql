-- =====================================================================
-- Uzmanlık taksonomisi — düzeltme eki
-- Taxonomy migration'dan SONRA çalıştırın.
--
-- Sorun: eski "Adhd" kaydının slug'ı 'adhd' idi; migration 'dehb' slug'ıyla
-- YENİ bir kayıt oluşturdu. Terapistler hâlâ 'adhd' kaydına bağlı, 'dehb'
-- sayfası ise boş. Bu ek, ikisini birleştirir.
-- =====================================================================

-- ── 1. adhd → dehb birleştirme ──────────────────────────────────────
do $$
declare
  dup_id  uuid;   -- eski 'adhd'
  keep_id uuid;   -- yeni 'dehb'
begin
  select id into dup_id  from public.specialties where slug = 'adhd' limit 1;
  select id into keep_id from public.specialties where slug = 'dehb' limit 1;

  if dup_id is not null and keep_id is not null then
    insert into public.professional_specialties (professional_id, specialty_id)
    select ps.professional_id, keep_id
    from public.professional_specialties ps
    where ps.specialty_id = dup_id
      and not exists (
        select 1 from public.professional_specialties x
        where x.professional_id = ps.professional_id and x.specialty_id = keep_id
      );

    delete from public.professional_specialties where specialty_id = dup_id;
    delete from public.specialties where id = dup_id;

  elsif dup_id is not null and keep_id is null then
    -- 'dehb' yoksa eski kaydı yerinde güncelle (bağlantılar korunur)
    update public.specialties
    set slug = 'dehb',
        name = 'Dikkat Eksikliği ve Hiperaktivite (DEHB)',
        type = 'konu',
        sort_order = 110
    where id = dup_id;
  end if;
end $$;

-- ── 2. Tipi atanmamış eski kayıtları yakala ─────────────────────────
-- (sort_order 999 = migration'da eşleşmemiş, gözden geçirilmeli)
select id, slug, name, type, sort_order
from public.specialties
where sort_order = 999
order by name;

-- ── 3. TEŞHİS: her uzmanlığa kaç terapist bağlı? ───────────────────
select s.slug, s.name, s.type, count(ps.professional_id) as terapist_sayisi
from public.specialties s
left join public.professional_specialties ps on ps.specialty_id = s.id
group by s.slug, s.name, s.type
order by terapist_sayisi desc;

-- ── 4. TEŞHİS: Bursa'da anksiyete ile çalışan görünür terapistler ──
select p.name, p.city, p.district, p.status, p.is_visible
from public.professionals p
join public.professional_specialties ps on ps.professional_id = p.id
join public.specialties s on s.id = ps.specialty_id
where s.slug = 'anksiyete'
  and p.city = 'Bursa'
  and p.status in ('approved','featured')
  and p.is_visible = true
  and p.removed_at is null;
