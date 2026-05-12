-- =====================================================================
-- Terapimap seed data — 18 therapists, 12 specialties
-- Run this AFTER schema.sql.
-- Idempotent: safe to re-run.
-- =====================================================================

-- ---------- specialties ----------
insert into public.specialties (slug, name_tr, name_en) values
  ('anksiyete',           'Anksiyete',                'Anxiety'),
  ('depresyon',           'Depresyon',                'Depression'),
  ('cift-terapisi',       'Çift Terapisi',            'Couples Therapy'),
  ('aile-terapisi',       'Aile Terapisi',            'Family Therapy'),
  ('travma',              'Travma ve EMDR',           'Trauma & EMDR'),
  ('cocuk-ergen',         'Çocuk ve Ergen',           'Child & Adolescent'),
  ('bdt',                 'Bilişsel Davranışçı Terapi','CBT'),
  ('panik-bozukluk',      'Panik Bozukluk',           'Panic Disorder'),
  ('obsesif-kompulsif',   'Obsesif Kompulsif Bozukluk','OCD'),
  ('yas-kayip',           'Yas ve Kayıp',             'Grief & Loss'),
  ('ozguven',             'Özgüven ve Kişisel Gelişim','Self-esteem'),
  ('ilişki',              'İlişki Sorunları',         'Relationship Issues')
on conflict (slug) do update set
  name_tr = excluded.name_tr,
  name_en = excluded.name_en;

-- ---------- therapists ----------
insert into public.professionals
  (slug, name, title, professional_type, city, city_slug, district,
   is_online, is_in_person, experience_years, about, price_range,
   rating, photo_url, is_published, is_featured)
values
  ('elif-yilmaz',  'Elif Yılmaz',  'Klinik Psikolog',  'clinical_psychologist', 'İstanbul','istanbul','Kadıköy',     true,  true,  9,  'Anksiyete, panik atak ve özgüven konularında bilişsel davranışçı terapi (BDT) odaklı çalışıyorum.',  '₺1.200 - ₺1.800', 4.8, null, true, true),
  ('mert-demir',   'Mert Demir',   'Uzman Psikolog',   'psychologist',          'İstanbul','istanbul','Beşiktaş',    true,  true,  6,  'Depresyon ve ilişki sorunları üzerine çalışıyorum. Şema terapi ve BDT yaklaşımlarını birlikte kullanırım.', '₺1.000 - ₺1.500', 4.6, null, true, false),
  ('zeynep-kaya',  'Zeynep Kaya',  'Klinik Psikolog',  'clinical_psychologist', 'İstanbul','istanbul','Şişli',       true,  false, 12, 'EMDR ve travma odaklı terapi alanında uzmanlaşmış bir klinik psikoloğum. Yetişkinlerle çalışıyorum.', '₺1.500 - ₺2.000', 4.9, null, true, true),
  ('ahmet-celik',  'Ahmet Çelik',  'Psikoterapist',    'psychologist',          'İstanbul','istanbul','Üsküdar',     false, true,  15, 'Çift ve aile terapisi alanında 15 yılı aşkın deneyime sahibim. Sistemik aile terapisi yaklaşımı.',   '₺1.400 - ₺2.000', 4.7, null, true, true),
  ('sevgi-aydin',  'Sevgi Aydın',  'Uzman Psikolog',   'psychologist',          'İstanbul','istanbul','Beyoğlu',     true,  true,  4,  'Genç yetişkinlerle anksiyete, özgüven ve yaşam geçişleri üzerine çalışıyorum.',                      '₺900 - ₺1.300',   4.5, null, true, false),
  ('burak-sahin',  'Burak Şahin',  'Klinik Psikolog',  'clinical_psychologist', 'İstanbul','istanbul','Bakırköy',    true,  true,  8,  'Obsesif kompulsif bozukluk ve panik bozukluk alanında BDT temelli müdahaleler.',                     '₺1.100 - ₺1.600', 4.6, null, true, false),

  ('deniz-arslan', 'Deniz Arslan', 'Klinik Psikolog',  'clinical_psychologist', 'Ankara',  'ankara',  'Çankaya',     true,  true,  10, 'Yetişkinlerde depresyon, anksiyete ve travma. Bütüncül psikoterapi yaklaşımı.',                      '₺1.000 - ₺1.500', 4.8, null, true, true),
  ('canan-ozturk', 'Canan Öztürk', 'Uzman Psikolog',   'psychologist',          'Ankara',  'ankara',  'Çankaya',     true,  false, 7,  'Çevrimiçi seanslarla anksiyete, sosyal fobi ve özgüven konularında destek sunuyorum.',               '₺900 - ₺1.300',   4.5, null, true, false),
  ('emre-koc',     'Emre Koç',     'Psikoterapist',    'family_therapist',      'Ankara',  'ankara',  'Kızılay',     false, true,  13, 'Aile terapisi, çift terapisi ve ergen psikoterapisi alanlarında çalışıyorum.',                      '₺1.200 - ₺1.700', 4.7, null, true, false),
  ('hande-yildiz', 'Hande Yıldız', 'Klinik Psikolog',  'clinical_psychologist', 'Ankara',  'ankara',  'Bahçelievler',true,  true,  5,  'Çocuk ve ergenlerle oyun terapisi ve BDT yöntemleriyle çalışıyorum.',                               '₺900 - ₺1.300',   4.6, null, true, false),
  ('serkan-acar',  'Serkan Acar',  'Uzman Psikolog',   'psychologist',          'Ankara',  'ankara',  'Çayyolu',     true,  true,  11, 'Yas, kayıp ve yaşam krizleri üzerine derinlikli psikoterapi.',                                      '₺1.100 - ₺1.600', 4.8, null, true, true),

  ('aylin-keskin', 'Aylin Keskin', 'Klinik Psikolog',  'clinical_psychologist', 'İzmir',   'izmir',   'Alsancak',    true,  true,  6,  'BDT ve şema terapi ile anksiyete bozuklukları ve özgüven sorunları üzerine çalışırım.',             '₺900 - ₺1.300',   4.7, null, true, false),
  ('tolga-erdem',  'Tolga Erdem',  'Psikoterapist',    'family_therapist',      'İzmir',   'izmir',   'Karşıyaka',   false, true,  14, 'Çift terapisi ve ilişki sorunları. EFT (Duygu Odaklı Terapi) yaklaşımı.',                           '₺1.200 - ₺1.700', 4.8, null, true, true),
  ('gizem-tunc',   'Gizem Tunç',   'Uzman Psikolog',   'psychologist',          'İzmir',   'izmir',   'Bornova',     true,  true,  4,  'Genç yetişkinlerle depresyon, motivasyon kaybı ve mesleki yön bulma.',                              '₺800 - ₺1.200',   4.5, null, true, false),
  ('kaan-bulut',   'Kaan Bulut',   'Klinik Psikolog',  'clinical_psychologist', 'İzmir',   'izmir',   'Bostanlı',    true,  false, 9,  'EMDR ve travma sonrası stres bozukluğu (TSSB) alanında çevrimiçi terapi.',                          '₺1.100 - ₺1.500', 4.6, null, true, false),
  ('ipek-demirel', 'İpek Demirel', 'Uzman Psikolog',   'psychologist',          'İzmir',   'izmir',   'Konak',       true,  true,  7,  'OKB ve panik bozuklukta kanıt temelli BDT müdahaleleri.',                                          '₺1.000 - ₺1.400', 4.7, null, true, false),

  ('cem-yavuz',    'Cem Yavuz',    'Klinik Psikolog',  'clinical_psychologist', 'İstanbul','istanbul','Maltepe',     true,  true,  3,  'Yetişkinlerle özgüven, kariyer kaygısı ve ilişki konularında çalışıyorum.',                         '₺800 - ₺1.200',   4.4, null, true, false),
  ('selin-uzun',   'Selin Uzun',   'Uzman Psikolog',   'psychologist',          'Ankara',  'ankara',  'Ümitköy',     true,  true,  8,  'Çocuk-ergen ve aile terapisi. Sistemik aile yaklaşımı.',                                           '₺1.000 - ₺1.400', 4.7, null, true, false)
on conflict (slug) do update set
  name              = excluded.name,
  title             = excluded.title,
  professional_type = excluded.professional_type,
  city              = excluded.city,
  city_slug         = excluded.city_slug,
  district          = excluded.district,
  is_online         = excluded.is_online,
  is_in_person      = excluded.is_in_person,
  experience_years  = excluded.experience_years,
  about             = excluded.about,
  price_range       = excluded.price_range,
  rating            = excluded.rating,
  is_published      = excluded.is_published,
  is_featured       = excluded.is_featured;

-- ---------- professional_specialties links ----------
-- Clear and rebuild for the seeded therapists so this stays idempotent.
delete from public.professional_specialties
where professional_id in (
  select id from public.professionals where slug in (
    'elif-yilmaz','mert-demir','zeynep-kaya','ahmet-celik','sevgi-aydin','burak-sahin',
    'deniz-arslan','canan-ozturk','emre-koc','hande-yildiz','serkan-acar',
    'aylin-keskin','tolga-erdem','gizem-tunc','kaan-bulut','ipek-demirel',
    'cem-yavuz','selin-uzun'
  )
);

insert into public.professional_specialties (professional_id, specialty_id)
select p.id, s.id from public.professionals p, public.specialties s
where (p.slug, s.slug) in (
  ('elif-yilmaz',  'anksiyete'),  ('elif-yilmaz',  'panik-bozukluk'), ('elif-yilmaz',  'bdt'),       ('elif-yilmaz',  'ozguven'),
  ('mert-demir',   'depresyon'),  ('mert-demir',   'ilişki'),         ('mert-demir',   'bdt'),
  ('zeynep-kaya',  'travma'),     ('zeynep-kaya',  'depresyon'),      ('zeynep-kaya',  'anksiyete'),
  ('ahmet-celik',  'cift-terapisi'),('ahmet-celik','aile-terapisi'),  ('ahmet-celik',  'ilişki'),
  ('sevgi-aydin',  'anksiyete'),  ('sevgi-aydin',  'ozguven'),
  ('burak-sahin',  'obsesif-kompulsif'),('burak-sahin','panik-bozukluk'),('burak-sahin','bdt'),

  ('deniz-arslan', 'depresyon'),  ('deniz-arslan', 'anksiyete'),      ('deniz-arslan', 'travma'),
  ('canan-ozturk', 'anksiyete'),  ('canan-ozturk', 'ozguven'),
  ('emre-koc',     'aile-terapisi'),('emre-koc',   'cift-terapisi'),  ('emre-koc',     'cocuk-ergen'),
  ('hande-yildiz', 'cocuk-ergen'),('hande-yildiz', 'bdt'),
  ('serkan-acar',  'yas-kayip'),  ('serkan-acar',  'depresyon'),

  ('aylin-keskin', 'anksiyete'),  ('aylin-keskin', 'ozguven'),        ('aylin-keskin', 'bdt'),
  ('tolga-erdem',  'cift-terapisi'),('tolga-erdem','ilişki'),
  ('gizem-tunc',   'depresyon'),  ('gizem-tunc',   'ozguven'),
  ('kaan-bulut',   'travma'),     ('kaan-bulut',   'depresyon'),
  ('ipek-demirel', 'obsesif-kompulsif'),('ipek-demirel','panik-bozukluk'),('ipek-demirel','bdt'),

  ('cem-yavuz',    'ozguven'),    ('cem-yavuz',    'ilişki'),
  ('selin-uzun',   'cocuk-ergen'),('selin-uzun',   'aile-terapisi')
);
