-- =====================================================================
-- Uzmanlık taksonomisi — type kolonu + genişletilmiş liste (63 kalem)
-- Supabase SQL Editor'de MANUEL çalıştırın.
--
-- Güvenlik notu:
--   * Mevcut slug'lar KORUNUR → canlı landing URL'leri ve terapist
--     bağlantıları bozulmaz.
--   * Tek istisna: "Bilişsel Davranışçı" kaydı, "Bilişsel Davranışçı
--     Terapi (BDT)" kaydına birleştirilir (bağlantılar taşınır).
--   * Tekrar çalıştırmak güvenlidir (idempotent).
-- =====================================================================

-- ── 1. type kolonu ──────────────────────────────────────────────────
alter table public.specialties
  add column if not exists type text not null default 'konu';

alter table public.specialties
  drop constraint if exists specialties_type_check;
alter table public.specialties
  add constraint specialties_type_check
  check (type in ('konu', 'yontem', 'kitle'));

-- Arayüzde sabit sıralama için
alter table public.specialties
  add column if not exists sort_order integer not null default 999;

create index if not exists specialties_type_idx on public.specialties (type, sort_order);

-- ── 2. Duplicate birleştirme: "Bilişsel Davranışçı" → BDT ───────────
do $$
declare
  dup_id uuid;
  keep_id uuid;
begin
  select id into dup_id  from public.specialties where slug = 'bilissel-davranisci' limit 1;
  select id into keep_id from public.specialties where slug = 'bilissel-davranisci-terapi-bdt' limit 1;

  if dup_id is not null and keep_id is not null then
    -- Bağlantıları taşı (hedefte zaten varsa ekleme)
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
  end if;
end $$;

-- ── 3. Kayıtları ekle / güncelle (slug = kimlik) ────────────────────
insert into public.specialties (name, slug, type, sort_order)
values
  ('Anksiyete', 'anksiyete', 'konu', 10),
  ('Panik Bozukluk', 'panik-bozukluk', 'konu', 20),
  ('Sosyal Kaygı', 'sosyal-kaygi', 'konu', 30),
  ('Depresyon', 'depresyon', 'konu', 40),
  ('Travma ve TSSB', 'travma', 'konu', 50),
  ('Obsesif Kompulsif Bozukluk (OKB)', 'okb', 'konu', 60),
  ('Fobiler', 'fobi', 'konu', 70),
  ('Bipolar Bozukluk', 'bipolar-bozukluk', 'konu', 80),
  ('Yeme Bozuklukları', 'yeme-bozukluklari', 'konu', 90),
  ('Uyku Sorunları', 'uyku-sorunlari', 'konu', 100),
  ('Dikkat Eksikliği ve Hiperaktivite (DEHB)', 'dehb', 'konu', 110),
  ('Öfke Kontrolü', 'ofke-kontrolu', 'konu', 120),
  ('Stres ve Tükenmişlik', 'tukenmislik', 'konu', 130),
  ('Özgüven ve Benlik Saygısı', 'ozguven', 'konu', 140),
  ('Yas ve Kayıp', 'yas-ve-kayip', 'konu', 150),
  ('Bağımlılık', 'bagimlilik', 'konu', 160),
  ('Teknoloji ve Oyun Bağımlılığı', 'teknoloji-bagimliligi', 'konu', 170),
  ('Kişilik Bozuklukları', 'kisilik-bozukluklari', 'konu', 180),
  ('İlişki Sorunları', 'iliski-sorunlari', 'konu', 190),
  ('Boşanma ve Ayrılık', 'bosanma-ve-ayrilik', 'konu', 200),
  ('Ebeveynlik', 'ebeveynlik', 'konu', 210),
  ('Cinsel İşlev Sorunları', 'cinsel-islev-sorunlari', 'konu', 220),
  ('Doğum Sonrası Depresyon', 'dogum-sonrasi-depresyon', 'konu', 230),
  ('Bağlanma Sorunları', 'baglanma-sorunlari', 'konu', 240),
  ('Sınav Kaygısı', 'sinav-kaygisi', 'konu', 250),
  ('Kronik Hastalık Uyumu', 'kronik-hastalik', 'konu', 260),
  ('Kendine Zarar Verme', 'kendine-zarar-verme', 'konu', 270),
  ('Göç ve Kültürel Uyum', 'goc-ve-uyum', 'konu', 280),
  ('İş-Yaşam Dengesi', 'is-yasam-dengesi', 'konu', 290),
  ('Sosyal Beceri Gelişimi', 'sosyal-beceri', 'konu', 300),
  ('Davranış Sorunları', 'davranis-sorunlari', 'konu', 310),
  ('Somatik Belirtiler', 'somatik-belirtiler', 'konu', 320),
  ('Bilişsel Davranışçı Terapi (BDT)', 'bilissel-davranisci-terapi-bdt', 'yontem', 10),
  ('EMDR', 'emdr', 'yontem', 20),
  ('Şema Terapi', 'sema-terapi', 'yontem', 30),
  ('ACT (Kabul ve Kararlılık Terapisi)', 'act-terapi', 'yontem', 40),
  ('DBT (Diyalektik Davranışçı Terapi)', 'dbt', 'yontem', 50),
  ('Psikanaliz ve Psikodinamik Terapi', 'psikanaliz', 'yontem', 60),
  ('Gestalt Terapi', 'gestalt', 'yontem', 70),
  ('Varoluşçu Terapi', 'varoluscu-terapi', 'yontem', 80),
  ('Çözüm Odaklı Kısa Terapi', 'cozum-odakli-terapi', 'yontem', 90),
  ('Mindfulness Temelli Terapi', 'mindfulness', 'yontem', 100),
  ('Oyun Terapisi', 'oyun-terapisi', 'yontem', 110),
  ('Sanat Terapisi', 'sanat-terapisi', 'yontem', 120),
  ('Aile Terapisi', 'aile-terapisi', 'yontem', 130),
  ('Çift Terapisi', 'cift-terapisi', 'yontem', 140),
  ('EFT (Duygu Odaklı Terapi)', 'eft-duygu-odakli-terapi', 'yontem', 150),
  ('Gottman Çift Terapisi', 'gottman-terapisi', 'yontem', 160),
  ('Hipnoterapi', 'hipnoterapi', 'yontem', 170),
  ('Bilişsel Analitik Terapi', 'bilissel-analitik-terapi', 'yontem', 180),
  ('Cinsel Terapi', 'cinsel-terapi', 'yontem', 190),
  ('Bütüncül Terapi', 'butuncul-terapi', 'yontem', 200),
  ('Nöropsikiyatri', 'noropsikiyatri', 'yontem', 210),
  ('Çocuk', 'cocuk-psikolojisi', 'kitle', 10),
  ('Ergen', 'ergen-terapisi', 'kitle', 20),
  ('Yetişkin', 'yetiskin', 'kitle', 30),
  ('Yaşlı Danışan', 'yasli-danisan', 'kitle', 40),
  ('Çiftler', 'ciftler', 'kitle', 50),
  ('Aileler', 'aileler', 'kitle', 60),
  ('LGBTİ+', 'lgbti-plus', 'kitle', 70),
  ('Kadın Sağlığı ve Perinatal', 'kadin-sagligi', 'kitle', 80),
  ('Öğrenciler', 'ogrenciler', 'kitle', 90),
  ('Kurumsal Çalışan Desteği', 'kurumsal-destek', 'kitle', 100)
on conflict (slug) do update set
  name       = excluded.name,
  type       = excluded.type,
  sort_order = excluded.sort_order;

-- ── 4. Kontrol ──────────────────────────────────────────────────────
select type, count(*) from public.specialties group by type order by type;
select slug, name, type, sort_order from public.specialties order by type, sort_order;
