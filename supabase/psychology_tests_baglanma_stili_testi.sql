-- =====================================================================
-- Psikoloji Testleri — "Bağlanma Stili Testi" (viral tip, kategorik)
--
-- Klasik akademik bağlanma tipolojisine (Bowlby/Ainsworth, Bartholomew'in
-- 4 kategorili yetişkin bağlanma modeli — güvenli/kaygılı/kaçıngan/karmaşık)
-- dayanan ama kendi yazdığımız, lisanslı bir ölçek (ör. ECR-R) kopyalamayan
-- viral tarzda bir testtir. Klinik tanı aracı değildir.
--
-- Diğer testlerden farklı bir puanlama modeli kullanır: ortak bir Likert
-- skalası + toplam puan yerine, her sorunun kendi seçenekleri vardır ve her
-- seçenek bir bağlanma stiline "oy" verir. En çok oy alan stil kazanır.
-- Bu, `TestQuestion.options` ve `TestScoring.categories` alanlarını
-- kullanır — TestRunner/route.ts/email.ts'deki kategorik test desteğiyle
-- birlikte deploy edilmelidir (ayrı olarak gönderildi).
--
-- Diğer testlerle aynı upsert deseni: dosya güvenle tekrar çalıştırılabilir.
-- is_published hâlâ false.
-- =====================================================================
insert into public.psychology_tests
  (slug, title_tr, title_en, intro_tr, kind, source_label, specialty_id, questions, scoring, is_published)
select
  'baglanma-stili-testi',
  'Bağlanma Stili Testi',
  'Attachment Style Test',
  'İlişkilerde yakınlık ve güvene nasıl yaklaştığınızı keşfeden 8 soruluk kısa bir test. Bir tanı aracı değildir.',
  'viral',
  null,
  (select id from public.specialties where slug = 'baglanma-sorunlari'),
  '[
    { "id": "q1", "text_tr": "Partnerin mesajlarına her zamankinden geç cevap verdiğinde ilk aklına gelen ne olur?", "options": [
      { "label_tr": "Muhtemelen meşguldür, birazdan yazar diye düşünürüm.", "category": "guvenli" },
      { "label_tr": "Bir şey mi oldu, benden mi uzaklaşıyor diye endişelenmeye başlarım.", "category": "kaygili" },
      { "label_tr": "Pek umursamam, ben de kendi işime bakarım.", "category": "kacingan" },
      { "label_tr": "Hem endişelenirim hem de içime kapanırım.", "category": "karmasik" }
    ]},
    { "id": "q2", "text_tr": "Bir ilişkide yakınlaşma arttıkça genelde ne hissedersin?", "options": [
      { "label_tr": "Rahat hissederim, yakınlığı doğal karşılarım.", "category": "guvenli" },
      { "label_tr": "Daha da yakınlaşmak, ilişkiyi güvence altına almak isterim.", "category": "kaygili" },
      { "label_tr": "Biraz sıkışmış hissedip mesafe koymak isterim.", "category": "kacingan" },
      { "label_tr": "Hem yakınlaşmak isterim hem de yaklaştıkça ürkerim.", "category": "karmasik" }
    ]},
    { "id": "q3", "text_tr": "Bir tartışmadan sonra genelde nasıl davranırsın?", "options": [
      { "label_tr": "Sakinleştiğimde konuyu açık şekilde konuşmaya çalışırım.", "category": "guvenli" },
      { "label_tr": "Hemen barışmak, ilişkinin bozulmadığından emin olmak isterim.", "category": "kaygili" },
      { "label_tr": "Biraz zaman geçirip kendi başıma sakinleşmeyi tercih ederim.", "category": "kacingan" },
      { "label_tr": "Önce uzaklaşırım, sonra pişman olup geri dönerim.", "category": "karmasik" }
    ]},
    { "id": "q4", "text_tr": "Partnerinin senden bağımsız planlar yapması (arkadaşlarıyla çıkması gibi) seni nasıl hissettirir?", "options": [
      { "label_tr": "Gayet normal karşılarım, kendi zamanımı da değerlendiririm.", "category": "guvenli" },
      { "label_tr": "İçimde hafif bir kaygı oluşur, dışlanmış gibi hissedebilirim.", "category": "kaygili" },
      { "label_tr": "Aslında rahatlarım, kendi alanım olduğu için memnun olurum.", "category": "kacingan" },
      { "label_tr": "Önce rahatlarım ama sonra neden beni de davet etmedi diye düşünmeye başlarım.", "category": "karmasik" }
    ]},
    { "id": "q5", "text_tr": "Yeni bir ilişkiye başlarken en çok neyi zor bulursun?", "options": [
      { "label_tr": "Genelde zorlanmam, zamanla güven inşa ederim.", "category": "guvenli" },
      { "label_tr": "Karşımdakinin beni gerçekten önemseyip önemsemediğinden emin olamamak.", "category": "kaygili" },
      { "label_tr": "Duygusal olarak açılmak, savunmasız hissetmek.", "category": "kacingan" },
      { "label_tr": "Hem yakınlaşmak istemek hem de güvenmekte zorlanmak.", "category": "karmasik" }
    ]},
    { "id": "q6", "text_tr": "Partnerin senden duygusal destek istediğinde ilk tepkin ne olur?", "options": [
      { "label_tr": "Yanında olurum, dinlemeye çalışırım.", "category": "guvenli" },
      { "label_tr": "Her şeyi bırakıp hemen ona odaklanırım, bazen fazlasıyla.", "category": "kaygili" },
      { "label_tr": "Nasıl tepki vereceğimi bilemem, biraz mesafeli kalabilirim.", "category": "kacingan" },
      { "label_tr": "Yardım etmek isterim ama nasıl yaklaşacağımı bilemeyip geri çekilebilirim.", "category": "karmasik" }
    ]},
    { "id": "q7", "text_tr": "İlişkinde \"biz nereye gidiyoruz\" sorusunu kendine ne sıklıkla sorarsın?", "options": [
      { "label_tr": "Merak ederim ama bu beni kaygılandırmaz.", "category": "guvenli" },
      { "label_tr": "Sık sık, hatta bazen saplantılı şekilde düşünürüm.", "category": "kaygili" },
      { "label_tr": "Nadiren; ilişkiyi fazla tanımlamaya gerek duymam.", "category": "kacingan" },
      { "label_tr": "Bazen çok düşünürüm bazen hiç düşünmek istemem.", "category": "karmasik" }
    ]},
    { "id": "q8", "text_tr": "Bir ilişki bittiğinde genel tepkin nasıl olur?", "options": [
      { "label_tr": "Üzülürüm ama zamanla toparlanırım, ders çıkarırım.", "category": "guvenli" },
      { "label_tr": "Uzun süre etkisinde kalırım, geri dönüş ihtimalini çok düşünürüm.", "category": "kaygili" },
      { "label_tr": "Çabuk kapatırım, fazla üzerinde durmam.", "category": "kacingan" },
      { "label_tr": "Hem çok etkilenirim hem de kendimi hissettirmemeye çalışırım.", "category": "karmasik" }
    ]}
  ]'::jsonb,
  '{
    "categories": [
      { "key": "guvenli",  "label_tr": "Güvenli Bağlanma",  "summary_tr": "Sonuçlarınız güvenli bağlanma stiline işaret ediyor. Yakınlığı ve bağımsızlığı bir arada rahatça yaşayabiliyor, ilişkilerde genellikle güven duyabiliyorsunuz. Bu güçlü bir temel; yine de her ilişki kendi zorluklarını getirebilir, gerektiğinde bir uzmandan destek almak her zaman değerlidir." },
      { "key": "kaygili",  "label_tr": "Kaygılı Bağlanma",  "summary_tr": "Sonuçlarınız kaygılı bağlanma stiline işaret ediyor. İlişkilerde yakınlığa ve onaya olan ihtiyacınız güçlü olabilir; partnerinizin duygularından emin olamadığınızda kaygı yaşayabilirsiniz. Bu örüntüleri anlamak ve üzerinde çalışmak bir uzmanla birlikte oldukça faydalı olabilir." },
      { "key": "kacingan", "label_tr": "Kaçıngan Bağlanma", "summary_tr": "Sonuçlarınız kaçıngan bağlanma stiline işaret ediyor. Bağımsızlığa değer veriyor, duygusal yakınlıkta zaman zaman mesafeli kalmayı tercih edebiliyorsunuz. Yakınlıkla ilgili bu örüntüleri keşfetmek isterseniz bir uzmanla konuşmak yeni bir bakış açısı kazandırabilir." },
      { "key": "karmasik", "label_tr": "Karmaşık Bağlanma",  "summary_tr": "Sonuçlarınız karmaşık (kaygılı-kaçıngan) bağlanma stiline işaret ediyor. Yakınlık hem çekici hem de kaygı verici gelebiliyor; bu çelişkili hisler zaman zaman yorucu olabilir. Bir uzmanla birlikte çalışmak bu örüntüleri anlamlandırmada size destek olabilir." }
    ]
  }'::jsonb,
  false
on conflict (slug) do update set
  intro_tr     = excluded.intro_tr,
  source_label = excluded.source_label,
  specialty_id = excluded.specialty_id,
  questions    = excluded.questions,
  scoring      = excluded.scoring;
