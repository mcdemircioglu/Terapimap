-- =====================================================================
-- Ankara odaklı özgün landing içerikleri (seo_landing_pages)
-- GSC talep sinyaline göre Tier 1 sayfalar: DEHB, Çocuk, BDT, Ergen.
-- Şablon benzerliğini kırıp sıralamayı iyileştirmek için her sayfaya
-- özel H1 + meta + giriş + 5 özel FAQ girer.
-- Supabase SQL Editor'de çalıştırın. Idempotent (ON CONFLICT ... DO UPDATE).
-- Ön koşul: seo_landing_migration.sql çalıştırılmış olmalı.
-- Not: is_indexable=true sayfayı ZORLA indexlemez; terapist yoksa şablon
-- yine noindex tutar (güvenli).
-- =====================================================================

-- ── 1) Ankara DEHB ───────────────────────────────────────────────────
insert into public.seo_landing_pages
  (city_slug, specialty_slug, title, description, h1, intro_content, faq_json, is_indexable)
values (
  'ankara', 'dehb',
  $t$Ankara DEHB Uzmanları — Çocuk ve Yetişkin | Terapimap$t$,
  $d$Ankara'da DEHB (dikkat eksikliği ve hiperaktivite) alanında çalışan uzmanları inceleyin. Çocuk, ergen ve yetişkin için değerlendirme, terapi ve takip seçenekleri.$d$,
  $h1$Ankara DEHB Uzmanları: Çocuk ve Yetişkin Dikkat Eksikliği Desteği$h1$,
  $intro$Ankara'da DEHB (dikkat eksikliği ve hiperaktivite bozukluğu) alanında çalışan psikolog, psikiyatrist ve psikolojik danışmanları Terapimap üzerinden inceleyebilirsiniz. Hem çocuk ve ergenler hem de erişkin DEHB'si için değerlendirme, terapi ve gerektiğinde ilaç yönetimi sunan uzmanları ilçeye ve görüşme türüne göre filtreleyebilirsiniz.$intro$,
  $faq$[
    {"q":"Ankara'da DEHB tanısını kim koyar?","a":"DEHB tanısı bir hekim (çocuk-ergen ya da erişkin psikiyatristi) tarafından; klinik görüşme, öykü ve değerlendirme ölçekleriyle konur. Psikolog ve psikolojik danışmanlar değerlendirme sürecine ve terapiye katkı sunar; ilaç tedavisini yalnızca hekim düzenler. Ankara'daki uzmanların unvanlarını profil sayfalarından görebilirsiniz."},
    {"q":"Çocuğumda DEHB olabileceğini düşünüyorum, Ankara'da nereye başvurmalıyım?","a":"Çocuk ve ergenlerde DEHB için çocuk-ergen ruh sağlığı alanında çalışan bir uzmanla başlamak en doğrusudur. Terapimap'te Ankara'da çocuk ve ergenlerle çalışan uzmanları filtreleyip, okul ve aile iş birliğine açık birini seçebilirsiniz."},
    {"q":"Yetişkin DEHB'si için de Ankara'da uzman var mı?","a":"Evet. DEHB yalnızca çocukluğa özgü değildir; erişkinlikte de dikkat dağınıklığı, erteleme ve düzensizlik olarak sürebilir. Ankara'da erişkin DEHB değerlendirmesi ve takibi yapan psikiyatrist ve terapistleri listede bulabilirsiniz."},
    {"q":"DEHB'de terapi mi ilaç mı gerekir?","a":"İhtiyaca göre değişir. Kanıta dayalı yaklaşımda ilaç, davranışçı yöntemler ve psikoeğitim çoğu zaman birlikte değerlendirilir. Hangi kombinasyonun uygun olduğuna değerlendirmeden sonra uzmanınızla karar verirsiniz. Terapimap sağlık hizmeti sunmaz; sizi uzmanlarla buluşturur."},
    {"q":"Ankara'da online DEHB desteği mümkün mü?","a":"Birçok uzman online görüşme sunar; özellikle terapi ve takip görüşmeleri çevrimiçi yürütülebilir. Yine de ilk değerlendirme için uzmanınız yüz yüze görüşmeyi tercih edebilir. Listeyi 'Online' filtresiyle daraltabilirsiniz."}
  ]$faq$::jsonb,
  true
)
on conflict (city_slug, specialty_slug) do update set
  title = excluded.title, description = excluded.description, h1 = excluded.h1,
  intro_content = excluded.intro_content, faq_json = excluded.faq_json,
  is_indexable = excluded.is_indexable, updated_at = now();

-- ── 2) Ankara Çocuk Psikolojisi ──────────────────────────────────────
insert into public.seo_landing_pages
  (city_slug, specialty_slug, title, description, h1, intro_content, faq_json, is_indexable)
values (
  'ankara', 'cocuk-psikolojisi',
  $t$Ankara Çocuk Psikoloğu ve Uzmanları | Terapimap$t$,
  $d$Ankara'da çocuklarla çalışan psikolog ve çocuk ruh sağlığı uzmanlarını inceleyin. Oyun terapisi, kaygı, davranış sorunları ve aile desteği için doğru uzmanı bulun.$d$,
  $h1$Ankara Çocuk Psikoloğu ve Çocuk Ruh Sağlığı Uzmanları$h1$,
  $intro$Ankara'da çocuklarla çalışan psikolog ve çocuk ruh sağlığı uzmanlarını Terapimap üzerinden inceleyebilirsiniz. Oyun terapisi, kaygı, davranış sorunları, boşanma süreci ve okul uyumu gibi konularda deneyimli, aile iş birliğine açık uzmanları ilçeye ve görüşme türüne göre filtreleyebilirsiniz.$intro$,
  $faq$[
    {"q":"Ankara'da çocuğum için hangi uzmana başvurmalıyım?","a":"Çocuklarla çalışmak yetişkin terapisinden farklı bir uzmanlık ister. Çocuk alanında eğitim ve deneyime sahip bir psikolog ya da çocuk-ergen psikiyatristiyle başlamak en doğrusudur. Uzmanların çalıştığı yaş grubunu ve alanları profil sayfalarından görebilirsiniz."},
    {"q":"Çocuk terapisinde ebeveynin rolü nedir?","a":"Çocuk terapisi büyük ölçüde aileyle birlikte yürür. Uzman genellikle ebeveynlerle düzenli görüşür, evde uygulanacak yaklaşımlar önerir ve gerektiğinde okulla iş birliği yapar. Sürecin başarısında ailenin tutarlı desteği belirleyicidir."},
    {"q":"Oyun terapisi nedir, Ankara'da bulabilir miyim?","a":"Oyun terapisi, çocukların duygularını sözcükler yerine oyun yoluyla ifade etmesine dayanan bir yaklaşımdır ve özellikle küçük yaş grubunda kullanılır. Ankara'da oyun terapisiyle çalışan uzmanları listede uzmanlık alanına göre filtreleyerek bulabilirsiniz."},
    {"q":"Kaç yaşından itibaren çocuk terapisi uygundur?","a":"Yaklaşım yaşa göre değişir: küçük çocuklarda oyun ve aile temelli yöntemler, daha büyük çocuklarda konuşma temelli yöntemler öne çıkar. Uzman, ilk görüşmede çocuğunuzun yaşına ve ihtiyacına uygun yolu birlikte belirler."},
    {"q":"Ankara'da çocuk için online terapi olur mu?","a":"Bazı görüşmeler (özellikle ebeveyn danışmanlığı ve takip) online yapılabilir; ancak küçük çocuklarda yüz yüze çalışma çoğu zaman daha verimlidir. Hangi formatın uygun olduğunu uzmanınızla değerlendirebilir, listeyi 'Online' filtresiyle daraltabilirsiniz."}
  ]$faq$::jsonb,
  true
)
on conflict (city_slug, specialty_slug) do update set
  title = excluded.title, description = excluded.description, h1 = excluded.h1,
  intro_content = excluded.intro_content, faq_json = excluded.faq_json,
  is_indexable = excluded.is_indexable, updated_at = now();

-- ── 3) Ankara BDT (Bilişsel Davranışçı Terapi) ───────────────────────
insert into public.seo_landing_pages
  (city_slug, specialty_slug, title, description, h1, intro_content, faq_json, is_indexable)
values (
  'ankara', 'bilissel-davranisci-terapi-bdt',
  $t$Ankara BDT Uzmanları — Bilişsel Davranışçı Terapi | Terapimap$t$,
  $d$Ankara'da bilişsel davranışçı terapi (BDT) ile çalışan psikolog ve terapistleri inceleyin. Anksiyete, depresyon, panik ve OKB için kanıta dayalı destek.$d$,
  $h1$Ankara BDT (Bilişsel Davranışçı Terapi) Uzmanları$h1$,
  $intro$Ankara'da bilişsel davranışçı terapi (BDT) ile çalışan psikolog ve terapistleri Terapimap üzerinden inceleyebilirsiniz. Anksiyete, depresyon, panik bozukluk, takıntılar ve uyku sorunları gibi alanlarda yapılandırılmış, kanıta dayalı bir yaklaşımla çalışan uzmanları ilçeye ve görüşme türüne göre filtreleyebilirsiniz.$intro$,
  $faq$[
    {"q":"BDT hangi durumlarda tercih edilir?","a":"Bilişsel davranışçı terapi; anksiyete, depresyon, panik bozukluk, sosyal kaygı, takıntılar ve uyku sorunları gibi pek çok alanda yaygın olarak kullanılır. Belirli hedefler üzerinde yapılandırılmış biçimde çalışmak isteyenler için uygun bir seçenek olabilir."},
    {"q":"Ankara'da BDT çocuklar ve ergenler için de uygun mu?","a":"Evet. BDT çocuk ve ergenlere uyarlanmış biçimlerde de uygulanır. Ankara'da çocuk-ergen alanında ve BDT yöntemiyle çalışan uzmanları listede filtreleyerek bulabilirsiniz."},
    {"q":"BDT kaç seans sürer?","a":"BDT genellikle hedef odaklı ve görece kısa sürelidir; ancak seans sayısı kişiye, soruna ve hedeflere göre değişir. Net bir süre önceden garanti edilemez. Uzmanınız ilk görüşmelerde sizinle birlikte bir plan oluşturur."},
    {"q":"BDT'de ev ödevi verilir mi?","a":"Çoğu zaman evet. BDT'nin ayırt edici yönlerinden biri, seansta öğrenilenleri günlük yaşamda uygulamaya yönelik düzenli alıştırmalardır. Bu, sürecin etkisini artıran önemli bir bileşendir."},
    {"q":"Ankara'da online BDT mümkün mü?","a":"Birçok uzman görüntülü görüşme yoluyla online BDT sunar; araştırmalar online terapinin birçok durumda yüz yüze kadar etkili olabildiğini gösterir. Listeyi 'Online' filtresiyle daraltarak çevrimiçi çalışan uzmanları görebilirsiniz."}
  ]$faq$::jsonb,
  true
)
on conflict (city_slug, specialty_slug) do update set
  title = excluded.title, description = excluded.description, h1 = excluded.h1,
  intro_content = excluded.intro_content, faq_json = excluded.faq_json,
  is_indexable = excluded.is_indexable, updated_at = now();

-- ── 4) Ankara Ergen Terapisi ─────────────────────────────────────────
insert into public.seo_landing_pages
  (city_slug, specialty_slug, title, description, h1, intro_content, faq_json, is_indexable)
values (
  'ankara', 'ergen-terapisi',
  $t$Ankara Ergen Terapisti ve Danışmanları | Terapimap$t$,
  $d$Ankara'da ergenlerle çalışan psikolog ve danışmanları inceleyin. Sınav kaygısı, ergenlik, ilişki ve davranış sorunlarında hem ergen hem aile için destek.$d$,
  $h1$Ankara Ergen Terapisti ve Ergen Ruh Sağlığı Uzmanları$h1$,
  $intro$Ankara'da ergenlerle çalışan psikolog ve danışmanları Terapimap üzerinden inceleyebilirsiniz. Sınav kaygısı, ergenlik dönemi çatışmaları, özgüven, ilişki ve davranış sorunları gibi konularda hem gençle hem aileyle çalışabilen uzmanları ilçeye ve görüşme türüne göre filtreleyebilirsiniz.$intro$,
  $faq$[
    {"q":"Ergenim terapiye gitmek istemiyor, ne yapmalıyım?","a":"Bu çok yaygındır. Ergenle çalışan deneyimli bir uzman, güven kurmaya ve genci sürece isteyerek dahil etmeye özen gösterir. Zorlamak yerine, ilk görüşmeyi bir 'tanışma' olarak çerçevelemek çoğu zaman işe yarar. Uzman seçerken ergenlerle çalışma deneyimine bakmanız önemlidir."},
    {"q":"Ankara'da ergenim için hangi uzmana başvurmalıyım?","a":"Ergenlerle çalışmak ayrı bir yaklaşım gerektirir. Ergen ve çocuk-ergen alanında deneyimli bir psikolog ya da danışmanla başlamak en doğrusudur. Uzmanların çalıştığı yaş grubunu profil sayfalarından görebilirsiniz."},
    {"q":"Ergen terapisinde ailenin rolü nedir?","a":"Süreç ağırlıklı olarak gençle yürütülse de, aile çoğu zaman görüşmelere belirli aralıklarla dahil edilir. Gizlilik ile aile iş birliği arasındaki dengeyi uzman, gencin yararını gözeterek kurar."},
    {"q":"Sınav kaygısı için Ankara'da ergen uzmanı bulabilir miyim?","a":"Evet. Sınav kaygısı ergenlerde en sık görülen başvuru nedenlerinden biridir. Ankara'da bu alanda çalışan uzmanları listede filtreleyip, hem kaygıyı yönetmeye hem çalışma düzenine odaklanan birini seçebilirsiniz."},
    {"q":"Ergenim için online terapi uygun mu?","a":"Ergenler dijital ortama yatkın olduğundan online terapi çoğu zaman iyi işler; özellikle takip görüşmelerinde pratiktir. İlk görüşme için uzmanınız yüz yüze tercih edebilir. Listeyi 'Online' filtresiyle daraltabilirsiniz."}
  ]$faq$::jsonb,
  true
)
on conflict (city_slug, specialty_slug) do update set
  title = excluded.title, description = excluded.description, h1 = excluded.h1,
  intro_content = excluded.intro_content, faq_json = excluded.faq_json,
  is_indexable = excluded.is_indexable, updated_at = now();
