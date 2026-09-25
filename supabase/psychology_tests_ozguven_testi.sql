-- =====================================================================
-- Psikoloji Testleri — "Özgüven Testi" (Rosenberg Özgüven Ölçeği tabanlı)
-- Rosenberg Self-Esteem Scale (Morris Rosenberg, 1965) yaygın olarak
-- serbestçe kullanılan, araştırma ve klinik ortamlarda ücretsiz
-- uygulanabilen klasik bir öz-saygı ölçeğidir. 5 maddesi olumlu,
-- 5 maddesi olumsuz ifade — olumsuz maddeler ters puanlanır
-- (bkz. `questions[].reverse`, TestRunner bu alanı otomatik uygular).
--
-- Diğer testlerle aynı upsert deseni: dosya güvenle tekrar çalıştırılabilir.
-- is_published hâlâ false — diğer testlerle aynı şekilde, klinik onay
-- sorusu netleşmeden yayına almıyoruz.
--
-- NOT: Bu değişiklik `TestQuestion.reverse` alanını ve TestRunner'daki
-- ters puanlama mantığını gerektirir — ilgili kod değişikliği ayrıca
-- deploy edildi (src/types/database.ts, src/components/tests/TestRunner.tsx).
-- =====================================================================
insert into public.psychology_tests
  (slug, title_tr, title_en, intro_tr, kind, source_label, specialty_id, questions, scoring, is_published)
select
  'ozguven-testi',
  'Özgüven Testi',
  'Self-Esteem Test',
  'Kendinize dair genel değerlendirmenizi ölçen, klasik ve yaygın olarak kullanılan 10 soruluk kısa bir öz-değerlendirme aracı. Bir tanı aracı değildir.',
  'viral',
  'Rosenberg Özgüven Ölçeği',
  (select id from public.specialties where slug = 'ozguven'),
  '[
    { "id": "q1",  "text_tr": "Genel olarak kendimden memnunum." },
    { "id": "q2",  "text_tr": "Bazen kendimi hiçbir işe yaramaz gibi hissediyorum.", "reverse": true },
    { "id": "q3",  "text_tr": "Birçok iyi özelliğim olduğunu düşünüyorum." },
    { "id": "q4",  "text_tr": "Çoğu insan kadar iyi iş yapabildiğimi düşünüyorum." },
    { "id": "q5",  "text_tr": "Gurur duyacak çok fazla şeyim olmadığını hissediyorum.", "reverse": true },
    { "id": "q6",  "text_tr": "Zaman zaman kendimi gerçekten işe yaramaz hissediyorum.", "reverse": true },
    { "id": "q7",  "text_tr": "Kendimi en az başkaları kadar değerli buluyorum." },
    { "id": "q8",  "text_tr": "Kendime karşı daha fazla saygı duyabilmeyi isterdim.", "reverse": true },
    { "id": "q9",  "text_tr": "Genel olarak, kendimi başarısız biri gibi hissetme eğilimindeyim.", "reverse": true },
    { "id": "q10", "text_tr": "Kendime karşı olumlu bir tutum içindeyim." }
  ]'::jsonb,
  '{
    "scale": [
      { "label_tr": "Kesinlikle katılmıyorum", "value": 0 },
      { "label_tr": "Katılmıyorum", "value": 1 },
      { "label_tr": "Katılıyorum", "value": 2 },
      { "label_tr": "Kesinlikle katılıyorum", "value": 3 }
    ],
    "max_score": 30,
    "tiers": [
      { "min": 0,  "max": 14, "label_tr": "Düşük düzey",  "summary_tr": "Yanıtlarınıza göre kendinize dair değerlendirmeniz şu anda düşük düzeyde görünüyor. Bu düşünce kalıplarını bir uzmanla birlikte ele almak, kendinize bakış açınızı güçlendirmede yardımcı olabilir." },
      { "min": 15, "max": 25, "label_tr": "Orta düzey",   "summary_tr": "Özgüven düzeyiniz genel olarak orta/normal aralıkta görünüyor. Yine de kendinize dair zaman zaman olumsuz düşüncelere kapılıyorsanız bir uzmanla konuşmak faydalı olabilir." },
      { "min": 26, "max": 30, "label_tr": "Yüksek düzey", "summary_tr": "Kendinize dair değerlendirmeniz yüksek düzeyde görünüyor. Bu genellikle sağlıklı bir öz-saygının işaretidir; bu farkındalığı korumak için kendinize zaman ayırmaya devam edin." }
    ]
  }'::jsonb,
  false
on conflict (slug) do update set
  intro_tr     = excluded.intro_tr,
  source_label = excluded.source_label,
  specialty_id = excluded.specialty_id,
  questions    = excluded.questions,
  scoring      = excluded.scoring;
