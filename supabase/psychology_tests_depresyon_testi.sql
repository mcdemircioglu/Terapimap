-- =====================================================================
-- Psikoloji Testleri — "Depresyon Testi" (PHQ-8 tabanlı) seed/upsert
-- PHQ-8, PHQ-9'un (Spitzer, Kroenke, Williams — Pfizer, kamuya açık) 9.
-- maddesini (kendine zarar verme/intihar düşünceleri) çıkaran, klinik
-- geçerliliği bilimsel literatürde ayrıca doğrulanmış 8 maddelik bir
-- varyanttır (Kroenke ve ark., 2009). Klinisyen denetimi olmayan,
-- herkese açık bir öz-değerlendirme testinde bu riskli maddeyi
-- kullanmamak için bilinçli olarak PHQ-8 tercih edildi.
--
-- Diğer testlerle aynı upsert deseni: dosya güvenle tekrar çalıştırılabilir.
-- is_published hâlâ false — kaygı testiyle aynı şekilde, klinik onay
-- sorusu netleşmeden yayına almıyoruz.
-- =====================================================================
insert into public.psychology_tests
  (slug, title_tr, title_en, intro_tr, kind, source_label, specialty_id, questions, scoring, is_published)
select
  'depresyon-testi',
  'Depresyon Testi',
  'Depression Test',
  'Son 2 haftadır yaşadığınız depresif belirtilerin sıklığını değerlendiren 8 soruluk kısa bir öz-değerlendirme aracı. Bir tanı aracı değildir.',
  'clinical',
  'PHQ-8',
  (select id from public.specialties where slug = 'depresyon'),
  '[
    { "id": "q1", "text_tr": "Bir şeylerden eskisi kadar zevk alamıyorum ya da onlara ilgi duyamıyorum." },
    { "id": "q2", "text_tr": "Kendimi çökkün, üzgün ya da umutsuz hissediyorum." },
    { "id": "q3", "text_tr": "Uykuya dalmakta, uykumu sürdürmekte zorlanıyorum ya da normalden çok daha fazla uyuyorum." },
    { "id": "q4", "text_tr": "Kendimi yorgun hissediyorum ya da enerjim çok az." },
    { "id": "q5", "text_tr": "İştahım azaldı ya da normalden çok daha fazla yemek yiyorum." },
    { "id": "q6", "text_tr": "Kendimi kötü hissediyorum; başarısız olduğumu ya da ailemi hayal kırıklığına uğrattığımı düşünüyorum." },
    { "id": "q7", "text_tr": "Gazete okumak ya da televizyon izlemek gibi şeylere odaklanmakta zorlanıyorum." },
    { "id": "q8", "text_tr": "Başkalarının fark edebileceği kadar yavaş hareket ediyor ya da konuşuyorum; ya da tam tersine her zamankinden çok daha huzursuz ve kıpır kıpır oluyorum." }
  ]'::jsonb,
  '{
    "scale": [
      { "label_tr": "Hiç", "value": 0 },
      { "label_tr": "Birkaç gün", "value": 1 },
      { "label_tr": "Genelde", "value": 2 },
      { "label_tr": "Hemen hemen her gün", "value": 3 }
    ],
    "max_score": 24,
    "tiers": [
      { "min": 0,  "max": 4,  "label_tr": "Minimal düzey",     "summary_tr": "Belirttiğiniz yanıtlara göre depresif belirtileriniz minimal düzeyde görünüyor. Kendinizi zaman zaman üzgün hissediyorsanız bu hisleri bir uzmanla paylaşmak yine de faydalı olabilir." },
      { "min": 5,  "max": 9,  "label_tr": "Hafif düzey",       "summary_tr": "Hafif düzeyde depresif belirtiler gösteriyorsunuz. Bu belirtiler zaman zaman günlük yaşamınızı etkileyebilir; bir uzmanla konuşmak destekleyici olabilir." },
      { "min": 10, "max": 14, "label_tr": "Orta düzey",        "summary_tr": "Orta düzeyde depresif belirtiler gösteriyorsunuz. Bu düzeydeki belirtiler genellikle günlük yaşamı etkiler; bir uzmana danışmanızı öneririz." },
      { "min": 15, "max": 19, "label_tr": "Orta-ağır düzey",   "summary_tr": "Orta-ağır düzeyde depresif belirtiler gösteriyorsunuz. Bu belirtilerin sizi günlük yaşamda zorladığını tahmin ediyoruz; bir uzmandan destek almanızı önemle öneririz." },
      { "min": 20, "max": 24, "label_tr": "Ağır düzey",        "summary_tr": "Ağır düzeyde depresif belirtiler gösteriyorsunuz. Bu sonuç bir tanı değildir, ancak lütfen bir ruh sağlığı uzmanından yakın zamanda destek almayı düşünün. Yalnız değilsiniz ve bu belirtiler uygun destekle iyileşebilir." }
    ]
  }'::jsonb,
  false
on conflict (slug) do update set
  intro_tr     = excluded.intro_tr,
  source_label = excluded.source_label,
  specialty_id = excluded.specialty_id,
  questions    = excluded.questions,
  scoring      = excluded.scoring;
