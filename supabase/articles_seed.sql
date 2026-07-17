-- =====================================================================
-- Psikoloji Rehberi — başlangıç içerik seti (16 makale)
-- Supabase SQL Editor'de çalıştırın.
-- Ön koşul: articles_migration.sql çalıştırılmış olmalı.
-- Not: 'on conflict (slug) do nothing' sayesinde tekrar çalıştırmak güvenlidir.
-- =====================================================================

insert into public.articles
  (title, slug, excerpt, content, category, meta_title, meta_description, status, is_featured, published_at)
values
(
  'İlk Terapi Seansında Ne Olur? Adım Adım İlk Görüşme',
  'ilk-terapi-seansinda-ne-olur',
  'İlk terapi seansı çoğu kişi için merak ve tedirginlik kaynağıdır. Bu rehberde ilk görüşmenin nasıl geçtiğini, nelerin konuşulduğunu ve nasıl hazırlanabileceğinizi adım adım anlatıyoruz.',
  'Terapiye başlama kararı almak önemli bir adımdır; ancak ilk seans öncesinde ne ile karşılaşacağınızı bilmemek tedirginlik yaratabilir. İyi haber şu: ilk seans, çoğu kişinin beklediğinden çok daha rahat geçer. Bu yazıda ilk görüşmenin tipik akışını ve hazırlanmanıza yardımcı olacak ipuçlarını bulacaksınız.

## İlk Seans Bir Tanışma Görüşmesidir

İlk seansın temel amacı tanışmak ve genel bir değerlendirme yapmaktır. Terapistiniz sizi daha iyi tanımak için sorular sorar; siz de terapistin çalışma tarzını gözlemleme fırsatı bulursunuz. Bu seansta "derin bir çalışma" beklentisi olmadığını bilmek rahatlatıcıdır — amaç güvenli bir zemin oluşturmaktır.

Görüşmede genellikle şu konular ele alınır:

- Sizi terapiye getiren temel neden ve güncel şikayetleriniz
- Şikayetlerin ne zamandır sürdüğü ve günlük yaşamınıza etkisi
- Genel yaşam öykünüz: aile, iş, ilişkiler, sağlık durumu
- Daha önce psikolojik destek alıp almadığınız
- Terapiden beklentileriniz

## Terapist Size Neler Anlatır?

İyi yapılandırılmış bir ilk seansta terapist de size bilgi verir:

- **Gizlilik ilkesi:** Paylaştıklarınızın hangi koşullarda gizli kalacağı açıklanır.
- **Çalışma çerçevesi:** Seans süresi (genellikle 45-60 dakika), sıklığı ve ücretlendirme netleştirilir.
- **Yaklaşım:** Terapistin hangi ekol ile çalıştığı (BDT, şema terapi, EMDR vb.) ve sürecin nasıl ilerleyebileceği paylaşılır.

## İlk Seansa Nasıl Hazırlanabilirsiniz?

Özel bir hazırlık şart değildir; ancak şunlar işinizi kolaylaştırır:

1. Sizi en çok zorlayan 2-3 konuyu önceden zihninizde netleştirin.
2. "Terapiden ne bekliyorum?" sorusuna kabaca bir yanıt düşünün.
3. Sormak istediklerinizi not alın — ücret, sıklık, yaklaşım gibi.
4. Kendinize karşı dürüst olmaya hazır olun; terapist sizi yargılamak için değil, anlamak için oradadır.

## Her Şeyi İlk Seansta Anlatmak Zorunda mısınız?

Hayır. Paylaşım hızınızı siz belirlersiniz. Henüz konuşmaya hazır olmadığınız konuları "Buna şimdilik girmek istemiyorum" diyerek erteleyebilirsiniz. Güven ilişkisi zamanla kurulur ve iyi bir terapist bu sınıra saygı gösterir.

## Ya Terapisti Sevmezseniz?

Terapinin etkinliğini belirleyen en güçlü faktörlerden biri, terapist ile danışan arasındaki uyumdur. İlk birkaç seans sonunda kendinizi anlaşılmış hissetmiyorsanız bu, terapinin size uygun olmadığı anlamına gelmez — farklı bir uzman denemek son derece normaldir. [Terapimap üzerinden](/tr/terapistler) uzmanlık alanına, şehre ve görüşme türüne göre size uygun terapistleri inceleyebilirsiniz.

## Sık Sorulan Sorular

**Ağlarsam ayıp olur mu?** Hayır. Terapi odası duyguların güvenle yaşanabildiği bir alandır; ağlamak sürecin doğal bir parçasıdır.

**İlk seansta tanı konur mu?** Genellikle hayır. Değerlendirme birkaç seans sürebilir; tanı koymak her terapinin amacı da değildir.

**Seans öncesi heyecanlanmak normal mi?** Tamamen normal. Çoğu danışan ilk seans sonrasında "meğer korkacak bir şey yokmuş" der.

İlk adımı atmak sürecin en zor kısmıdır. Sonrası, doğru uzmanla birlikte yürüyeceğiniz bir yoldur.',
  'terapi-rehberi',
  'İlk Terapi Seansında Ne Olur? İlk Görüşme Rehberi | Terapimap',
  'İlk terapi seansı nasıl geçer? Tanışma, değerlendirme, hedef belirleme ve sık sorulan sorularla adım adım ilk görüşme rehberi.',
  'published',
  false,
  '2026-07-01 01:11:30+00'
),(
  'Terapi Ücretleri 2026: Seans Fiyatları Neye Göre Belirlenir?',
  'terapi-ucretleri-2026',
  'Terapi seans ücretleri uzmanın deneyimine, şehre ve görüşme türüne göre değişir. Bu rehberde fiyatları etkileyen faktörleri ve bütçenize uygun destek bulmanın yollarını anlatıyoruz.',
  'Terapiye başlamayı düşünen çoğu kişinin ilk sorularından biri ücrettir. Net bir "standart fiyat" olmamasının nedeni, seans ücretlerinin birden fazla faktöre bağlı olmasıdır. Bu yazıda fiyatları neyin belirlediğini ve bütçenize uygun destek bulmanın yollarını ele alıyoruz.

## Seans Ücretini Belirleyen Faktörler

- **Uzmanın eğitimi ve deneyimi:** Klinik psikoloji yüksek lisansı, doktora, uluslararası sertifikalar (EMDR, şema terapi vb.) ve yıl bazında deneyim ücrete yansır.
- **Unvan:** Psikiyatristler tıp doktoru oldukları için muayene ücretleri genellikle psikologlardan farklı seyreder.
- **Şehir ve semt:** Büyükşehirlerde, özellikle merkezi semtlerdeki ofis maliyetleri seans ücretlerini yükseltir. İstanbul ve Ankara ortalamaları, Anadolu şehirlerine göre belirgin biçimde yüksektir.
- **Görüşme türü:** Online seanslar, ofis maliyeti içermediği için çoğu zaman yüz yüze seanslardan daha uygundur.
- **Seans süresi ve formatı:** Bireysel, çift veya aile seansları farklı ücretlendirilir; çift terapisi seansları genellikle daha uzun sürdüğü için daha yüksektir.

## Ücret Aralıkları Nasıl Yorumlanmalı?

Fiyat her zaman kaliteyi göstermez. Yüksek ücretli bir terapist sizin ihtiyacınıza uygun olmayabilir; daha uygun ücretli genç bir uzman ise tam aradığınız kişi olabilir. Önemli olan şudur:

1. Uzmanın **eğitim geçmişi ve uzmanlık alanı** sizin ihtiyacınızla örtüşüyor mu?
2. Düzenli devam edebileceğiniz, **sürdürülebilir** bir ücret mi?
3. Uzman, ücret ve çalışma koşullarını **ilk görüşmede şeffaf** biçimde açıklıyor mu?

Terapi genellikle haftada bir seans düzeninde ilerler. Bütçe planlaması yaparken tek seansın değil, birkaç aylık sürecin toplamını düşünmek daha gerçekçidir.

## Bütçeniz Kısıtlıysa Seçenekleriniz

- **Online terapi:** Ofis maliyeti olmadığı için genellikle daha ekonomiktir; şehir fark etmeksizin Türkiye''nin her yerindeki uzmanlarla çalışabilirsiniz.
- **Genç uzmanlar:** Deneyim yılı daha az olan ancak iyi eğitimli uzmanlar, kariyerlerinin başında daha erişilebilir ücretlerle çalışır.
- **Üniversite ve toplum ruh sağlığı merkezleri:** Bazı üniversitelerin psikoloji birimleri süpervizyon altında uygun ücretli seans sunar.
- **Seans sıklığını konuşun:** Bazı süreçlerde iki haftada bir seans da işlevsel olabilir; bunu terapistinizle açıkça değerlendirin.

## Ücret Konusunu Konuşmak Ayıp Değil

Ücret, seans sıklığı ve ödeme koşulları terapinin çerçevesinin bir parçasıdır ve ilk görüşmede net biçimde konuşulmalıdır. Profesyonel bir uzman bu sorulardan rahatsız olmaz; aksine çerçevenin netliği terapötik ilişkiyi güçlendirir.

## Size Uygun Ücretli Terapisti Bulun

[Terapimap''te](/tr/terapistler) uzmanların profillerinde seans ücret aralıklarını görebilir; şehir, uzmanlık alanı ve online/yüz yüze filtreleriyle bütçenize uygun terapistleri karşılaştırabilirsiniz. Unutmayın: ruh sağlığınıza yaptığınız yatırım, yaşam kalitenize yapılmış en kalıcı yatırımlardan biridir.',
  'terapi-rehberi',
  'Terapi Ücretleri 2026: Psikolog Seans Fiyatları | Terapimap',
  '2026''da terapi seans ücretleri ne kadar? Psikolog fiyatlarını etkileyen faktörler, online-yüz yüze farkı ve bütçenize uygun terapist bulma rehberi.',
  'published',
  false,
  '2026-07-03 01:11:30+00'
),(
  'Doğru Terapisti Nasıl Seçersiniz? 8 Pratik Kriter',
  'dogru-terapisti-nasil-secersiniz',
  'Terapiden alacağınız verimi en çok etkileyen şey doğru terapisti bulmaktır. Unvan, uzmanlık alanı, terapi ekolü ve uyum: seçim yaparken bakmanız gereken 8 kriteri derledik.',
  'Araştırmalar, terapinin başarısını etkileyen en güçlü faktörlerden birinin terapist ile danışan arasındaki ilişki kalitesi olduğunu gösteriyor. Yani "en iyi terapist" diye evrensel bir şey yok; **sizin için doğru terapist** var. İşte seçim yaparken kullanabileceğiniz 8 pratik kriter.

## 1. Unvanı ve Eğitimini Doğrulayın

Türkiye''de "psikolog" unvanı 4 yıllık psikoloji lisansı gerektirir; **klinik psikolog** unvanı için klinik psikoloji yüksek lisansı şarttır. Psikoterapi uygulamak ayrıca ekol eğitimi (BDT, şema terapi, EMDR vb.) gerektirir. Profilinde eğitim bilgisi şeffaf olmayan uzmanlara mesafeli yaklaşın.

## 2. Uzmanlık Alanına Bakın

Her terapist her konuda çalışmaz. Panik bozukluk için başvuruyorsanız kaygı bozuklukları deneyimi olan; ilişki sorunları içinse çift terapisi eğitimi almış bir uzman aramak sonuç alma olasılığınızı artırır. Terapimap profillerinde uzmanların çalışma alanlarını görebilirsiniz.

## 3. Terapi Ekolünü Sorun

Aynı sorun farklı yaklaşımlarla çalışılabilir:

- **Bilişsel Davranışçı Terapi (BDT):** Yapılandırılmış, hedef odaklı, görece kısa süreli.
- **Şema Terapi:** Tekrarlayan yaşam örüntüleri ve kronikleşmiş sorunlar için derinlemesine çalışma.
- **EMDR:** Özellikle travma sonrası stres için güçlü kanıta sahip.
- **Psikodinamik terapi:** Geçmiş yaşantıların bugüne etkisini keşfetmeye odaklı, genellikle daha uzun süreli.

"Hangi yaklaşımla çalışıyorsunuz ve benim konumda bu nasıl işler?" sorusu, ilk görüşmede sormanız gereken en değerli sorulardan biridir.

## 4. Deneyimi Değerlendirin — Ama Abartmayın

Deneyim yılı önemlidir ancak tek başına belirleyici değildir. Güncel eğitimlerini sürdüren, süpervizyon alan genç bir uzman; yıllardır kendini güncellemeyen deneyimli bir uzmandan daha etkili olabilir.

## 5. Görüşme Türüne Karar Verin

Yüz yüze görüşme mi, online mı? Düzenli devam edebilmek başarının ön koşuludur. Yoğun tempoda çalışıyorsanız veya şehrinizde aradığınız uzman yoksa [online terapi](/tr/online-terapi) güçlü bir alternatiftir.

## 6. Pratik Koşulları Netleştirin

Seans ücreti, sıklığı, iptal politikası ve randevu esnekliği sürdürülebilirliği doğrudan etkiler. Bu koşullar yaşamınıza uymuyorsa en iyi terapist bile fayda sağlayamaz.

## 7. İlk Seanslarda Uyumu Gözlemleyin

Kendinize şu soruları sorun:

- Kendimi yargılanmadan dinlenmiş hissediyor muyum?
- Sorularıma net ve anlaşılır yanıtlar alıyor muyum?
- Seanstan çıkarken küçük de olsa bir "anlaşıldım" hissi var mı?

İlk 2-3 seans sonunda yanıtlar çoğunlukla "hayır" ise farklı bir uzman denemek hakkınızdır — bu, sürece verilen bir ara değil, sürecin doğru kurulmasıdır.

## 8. Etik Sınırlara Dikkat Edin

Profesyonel bir terapist gizliliği korur, kesin çözüm/garanti vaat etmez, seans dışı çift ilişki kurmaz ve sizi kendi değerleri doğrultusunda yargılamaz. Bu sınırların ihlali ciddi bir uyarı işaretidir.

## Aramaya Başlayın

[Terapimap''te](/tr/terapistler) şehir, uzmanlık alanı ve görüşme türüne göre filtreleyerek size uygun terapistleri inceleyebilir, profillerinden eğitim ve deneyim bilgilerine ulaşabilirsiniz. Doğru eşleşme biraz zaman alabilir; ancak bu arayış, sürecin en değerli yatırımıdır.',
  'terapi-rehberi',
  'Doğru Terapist Seçimi: 8 Pratik Kriter | Terapimap',
  'Doğru terapisti nasıl seçersiniz? Unvan, uzmanlık alanı, terapi yaklaşımı ve terapötik uyum dahil 8 pratik kritere göre terapist seçme rehberi.',
  'published',
  false,
  '2026-07-04 01:11:30+00'
),(
  'Psikolog, Psikiyatrist, Klinik Psikolog: Aradaki Fark Nedir?',
  'psikolog-psikiyatrist-klinik-psikolog-farki',
  'Psikolog mu psikiyatrist mi? Klinik psikolog kimdir? Unvanların eğitim farklarını, kimin ilaç yazabileceğini ve hangi durumda kime başvurmanız gerektiğini net biçimde açıklıyoruz.',
  'Ruh sağlığı alanındaki unvanlar kafa karıştırıcı olabilir. "Psikoloğa mı gitmeliyim, psikiyatriste mi?" sorusu, destek almayı geciktiren en yaygın belirsizliklerden biridir. Bu rehberde unvanları ve görev alanlarını netleştiriyoruz.

## Psikolog Kimdir?

Psikolog, 4 yıllık **psikoloji lisans eğitimini** tamamlamış kişidir. İnsan davranışı ve zihinsel süreçler üzerine bilimsel eğitim almıştır. Ancak lisans eğitimi tek başına psikoterapi yapma yeterliliği kazandırmaz; terapi uygulayan psikologların ek olarak psikoterapi ekollerinde eğitim almış olması beklenir.

## Klinik Psikolog Kimdir?

Klinik psikolog, psikoloji lisansının üzerine **klinik psikoloji alanında yüksek lisans** (ve/veya doktora) yapmış uzmandır. Psikopatoloji, psikolojik değerlendirme ve terapi yöntemleri konusunda ileri eğitim alır; süpervizyon eşliğinde vaka deneyimi kazanır. Türkiye''de "uzman klinik psikolog" ifadesi bu yüksek lisans derecesine işaret eder. Depresyon, kaygı bozuklukları, travma gibi klinik durumlarla psikoterapi düzeyinde çalışmak öncelikle bu grubun alanıdır.

## Psikiyatrist Kimdir?

Psikiyatrist, **6 yıllık tıp eğitiminin ardından psikiyatri uzmanlığını** tamamlamış tıp doktorudur. En kritik fark şudur: **Türkiye''de yalnızca hekimler — pratikte ruh sağlığı alanında psikiyatristler — ilaç yazabilir.** Psikiyatristler tanı koyar, ilaç tedavisi düzenler ve takip eder; bazıları ek eğitimlerle psikoterapi de uygular.

## Psikolojik Danışman Kimdir?

Psikolojik Danışmanlık ve Rehberlik (PDR) lisans mezunudur. Eğitim, kariyer ve kişisel gelişim alanlarındaki uyum sorunlarında danışmanlık sunar. Klinik vakalarda çalışabilmesi için ek klinik eğitim ve terapi ekolü eğitimi gerekir.

## Kime, Hangi Durumda Gitmelisiniz?

**Psikiyatriste başvurmanız daha doğru olur:**

- Belirtileriniz günlük işlevselliğinizi ciddi biçimde bozuyorsa (işe gidememe, yataktan çıkamama)
- Uyku ve iştahta belirgin bozulma, intihar düşünceleri, gerçeklik algısında bozulma varsa
- İlaç tedavisi gerekebileceğini düşünüyorsanız veya mevcut ilacınızın düzenlenmesi gerekiyorsa

**Klinik psikolog / psikoterapiste başvurmanız daha doğru olur:**

- Kaygı, stres, ilişki sorunları, özgüven, yas gibi konularda konuşarak çalışmak istiyorsanız
- Belirtileriniz yaşamınızı zorluyor ama işlevselliğinizi tamamen bozmuyorsa
- İlaç kullanıyorsanız ve yanına terapi eklemek istiyorsanız

## En Etkili Model: İş Birliği

Orta ve şiddetli depresyon, panik bozukluk gibi birçok durumda araştırmaların işaret ettiği en etkili yaklaşım, **ilaç tedavisi ile psikoterapinin birlikte** yürütülmesidir. Psikiyatrist ve psikoloğun eşgüdüm içinde çalışması idealdir; birinden birine başvurmuş olmanız diğerine gitmenize engel değildir.

## Nereden Başlamalı?

Emin değilseniz şu pratik kuralı kullanabilirsiniz: belirtiler bedensel ve şiddetliyse psikiyatristle, duygusal-ilişkisel ve konuşarak çözülebilir görünüyorsa psikoterapistle başlayın. Her iki uzman da gerektiğinde sizi diğerine yönlendirecektir. [Terapimap''te](/tr/terapistler) psikolog, klinik psikolog ve psikiyatristleri unvanlarına göre filtreleyerek inceleyebilirsiniz.',
  'terapi-rehberi',
  'Psikolog, Psikiyatrist ve Klinik Psikolog Farkı | Terapimap',
  'Psikolog, psikiyatrist, klinik psikolog ve psikolojik danışman arasındaki farklar neler? Kim ilaç yazar, kime hangi durumda gidilir? Net rehber.',
  'published',
  false,
  '2026-07-05 01:11:30+00'
),(
  'Terapi Ne Kadar Sürer? Seans Sıklığı ve Süreç Beklentileri',
  'terapi-ne-kadar-surer',
  'Terapi kaç seans sürer, ne sıklıkla gidilir, ilerleme nasıl anlaşılır? Terapi sürecinin aşamalarını ve süreyi etkileyen faktörleri gerçekçi bir çerçevede anlatıyoruz.',
  '"Terapi ne kadar sürer?" sorusunun dürüst yanıtı şudur: duruma göre değişir. Ancak bu, öngörüsüz bir belirsizlik anlamına gelmez. Bu yazıda süreyi etkileyen faktörleri ve tipik süreç aşamalarını gerçekçi bir çerçevede ele alıyoruz.

## Süreyi Etkileyen Faktörler

- **Sorunun niteliği:** Tek ve güncel bir soruna odaklı çalışma (örneğin sınav kaygısı) genellikle daha kısa sürer. Çocukluktan gelen tekrarlayan örüntüler veya kronikleşmiş durumlar daha uzun bir çalışma gerektirir.
- **Terapi yaklaşımı:** BDT gibi yapılandırılmış ekoller sıklıkla 8-20 seans aralığında planlanır. Şema terapi ve psikodinamik terapiler doğaları gereği daha uzun soluklu olabilir.
- **Hedefleriniz:** "Panik ataklarım azalsın" ile "ilişki kurma biçimimi kökten değiştirmek istiyorum" farklı uzunlukta yolculuklardır.
- **Seans dışı çalışma:** Seanslar arasında verilen egzersiz ve gözlem ödevlerini uygulamak süreci belirgin biçimde hızlandırır.
- **Devam düzeni:** Sık iptal edilen, aralıkları açılan seanslar ivmeyi düşürür.

## Tipik Süreç Aşamaları

1. **Değerlendirme (1-3 seans):** Terapist sorunlarınızı, geçmişinizi ve hedeflerinizi anlamaya çalışır; birlikte bir çalışma planı oluşturursunuz.
2. **Aktif çalışma dönemi:** Sürecin gövdesidir. Belirtilerle çalışılır, yeni beceriler denenir, örüntüler fark edilir. İlk somut değişimler çoğunlukla bu dönemde hissedilir.
3. **Pekiştirme ve kapanış:** Kazanımlar günlük yaşama yerleşir, seans aralıkları açılır (iki haftada bir, ayda bir) ve süreç planlı biçimde sonlandırılır.

## Seans Sıklığı Nasıl Olmalı?

Standart başlangıç düzeni **haftada bir 45-60 dakikalık seanstır**. Bu ritim, hem süreklilik hem de seanslar arasında öğrenilenleri deneme alanı sağlar. Kriz dönemlerinde sıklık geçici olarak artabilir; ilerleyen dönemde iki haftada bire inebilir. Sıklık kararı terapistinizle birlikte, ihtiyacınıza göre verilir.

## İlerlediğinizi Nasıl Anlarsınız?

İlerleme her zaman "kendimi harika hissediyorum" biçiminde gelmez. Şu işaretler de ilerlemedir:

- Belirtilerin sıklığı veya şiddeti azalıyor
- Eskiden otomatik tepki verdiğiniz durumlarda artık durup düşünebiliyorsunuz
- Duygularınızı daha iyi adlandırabiliyorsunuz
- Yakınlarınız değişimi fark ettiğini söylüyor

Birkaç aydır hiçbir değişim hissetmiyorsanız bunu terapistinizle açıkça konuşun. "Süreç nasıl gidiyor?" konuşması terapinin doğal ve sağlıklı bir parçasıdır.

## Terapi Ne Zaman Biter?

İdeal bitiş, hedeflerinize ulaştığınızda ve kazanımların kalıcı olduğuna dair güven oluştuğunda, terapistinizle birlikte planlanır. Ani bırakmak yerine kapanış seansları yapmak, kazanımların pekişmesi açısından değerlidir. Yaşamınızın ilerleyen dönemlerinde ihtiyaç duyduğunuzda tekrar destek almak da son derece olağandır — terapi tek seferlik bir "tamir" değil, gerektiğinde başvurabileceğiniz bir kaynaktır.

## İlk Adım

Sürecin uzunluğu ne olursa olsun, başlamak en önemli adımdır. [Terapimap''te](/tr/terapistler) size uygun uzmanı bulup ilk görüşmede süreç beklentilerini birlikte netleştirebilirsiniz.',
  'terapi-rehberi',
  'Terapi Ne Kadar Sürer? Seans Sayısı ve Sıklığı | Terapimap',
  'Terapi kaç seans sürer? Seans sıklığı, sürecin aşamaları, süreyi etkileyen faktörler ve terapinin ne zaman biteceğine dair gerçekçi bir rehber.',
  'published',
  false,
  '2026-07-06 01:11:30+00'
),(
  'Online Terapi Etkili mi? Araştırmalar Ne Diyor?',
  'online-terapi-etkili-mi',
  'Online terapi yüz yüze terapi kadar etkili mi? Araştırma bulgularını, online terapinin avantajlarını, sınırlarını ve verimli bir online seans için ipuçlarını derledik.',
  'Video görüşmeyle terapi almak artık istisna değil, yaygın bir standart. Yine de pek çok kişinin aklında aynı soru var: "Ekran üzerinden yapılan terapi, yüz yüze terapi kadar işe yarar mı?"

## Araştırmalar Ne Gösteriyor?

Son yıllarda yapılan çok sayıda çalışma ve meta-analiz, özellikle **depresyon ve kaygı bozukluklarında** online (video tabanlı) terapinin yüz yüze terapiyle **benzer düzeyde etkili** olduğunu gösteriyor. Bilişsel davranışçı terapi gibi yapılandırılmış yaklaşımların çevrim içi uygulamaları en güçlü kanıta sahip alanlardır. Terapötik ittifakın — yani danışan ile terapist arasındaki güven ilişkisinin — video görüşmelerde de sağlıklı biçimde kurulabildiği gözlenmiştir.

Elbette her durum için aynı düzeyde kanıt yoktur; ağır psikiyatrik tablolar, aktif intihar riski veya psikotik belirtiler gibi durumlarda yüz yüze ve tıbbi takip içeren bir yapı gerekir.

## Online Terapinin Avantajları

- **Coğrafi özgürlük:** Şehrinizde aradığınız uzmanlıkta terapist yoksa Türkiye''nin herhangi bir yerindeki uzmanla çalışabilirsiniz. Yurt dışında yaşayanlar için ana dilde terapi imkânı sunar.
- **Zaman verimliliği:** Yol ve trafik ortadan kalkar; yoğun çalışanlar ve ebeveynler için devamlılığı kolaylaştırır.
- **Erişilebilir ücretler:** Ofis maliyeti olmadığı için online seanslar genellikle daha ekonomiktir.
- **Kendi alanınızın konforu:** Bazı danışanlar kendi güvenli alanlarından bağlanmanın açılmayı kolaylaştırdığını söyler.
- **Süreklilik:** Seyahat, taşınma veya hastalık dönemlerinde süreç kesintiye uğramaz.

## Sınırlamalar ve Dikkat Edilmesi Gerekenler

- **Mahremiyet alanı gerekir:** Evde seans yapabileceğiniz, duyulmayacağınız bir alan bulmak herkes için kolay değildir.
- **Teknik altyapı:** Stabil internet ve sessiz ortam şarttır; sık kopan bağlantı seansın derinliğini bozar.
- **Beden dili kısmen sınırlıdır:** Deneyimli online çalışan terapistler bunu telafi etmeyi bilir.
- **Uygunluk değerlendirmesi:** İyi bir terapist ilk görüşmede online formatın sizin durumunuz için uygun olup olmadığını değerlendirir ve gerekirse yüz yüze görüşmeye veya psikiyatriste yönlendirir.

## Verimli Bir Online Seans İçin İpuçları

1. Seanslarınız için sabit ve sessiz bir köşe belirleyin; kulaklık kullanın.
2. Seansa telefon yerine mümkünse bilgisayardan bağlanın; bildirimlerinizi kapatın.
3. Seans öncesi 10 dakika kendinize geçiş alanı tanıyın — toplantıdan seansa "ışınlanmayın".
4. Seans sonrası da birkaç dakika ayırın; hemen başka işe geçmeyin.

## Sonuç

Online terapi, doğru koşullar sağlandığında yüz yüze terapinin güçlü ve bilimsel olarak desteklenen bir alternatifidir. Önemli olan format değil; uzmanın yetkinliği, sizin devamlılığınız ve aranızdaki çalışma ilişkisidir. [Online görüşme sunan terapistleri Terapimap''te inceleyebilirsiniz](/tr/online-terapi).',
  'terapi-rehberi',
  'Online Terapi Etkili mi? Bilimsel Bulgular | Terapimap',
  'Online terapi ne kadar etkili? Araştırma bulguları, avantajlar, sınırlamalar ve verimli bir online terapi süreci için pratik öneriler.',
  'published',
  false,
  '2026-07-07 01:11:30+00'
),(
  'Anksiyete (Kaygı) Bozukluğu Nedir? Belirtileri ve Başa Çıkma Yolları',
  'anksiyete-bozuklugu-nedir',
  'Kaygı doğal bir duygudur; ancak sürekli, yoğun ve kontrol edilemez hâle geldiğinde bir kaygı bozukluğuna işaret edebilir. Belirtileri, türleri ve etkili başa çıkma yollarını anlatıyoruz.',
  'Sınav öncesi heyecan, önemli bir sunum öncesi gerginlik… Kaygı, tehlikeye ve belirsizliğe karşı geliştirdiğimiz doğal ve hatta işlevsel bir tepkidir. Sorun, kaygının **sürekli, orantısız ve kontrol edilemez** hâle gelmesi; yaşamınızı yönetmeye başlamasıdır.

## Kaygı Ne Zaman "Bozukluk" Hâline Gelir?

Şu işaretler, kaygının doğal sınırın ötesine geçtiğini düşündürür:

- Kaygı çoğu güne yayılıyor ve en az birkaç aydır sürüyor
- Endişeyi kontrol etmekte zorlanıyorsunuz; zihniniz sürekli "ya olursa" senaryoları üretiyor
- Kaygı nedeniyle durumlardan, mekânlardan veya sosyal ortamlardan kaçınıyorsunuz
- Uyku, konsantrasyon ve iş performansınız etkileniyor
- Bedensel belirtiler eşlik ediyor

## Bedensel Belirtiler

Kaygı yalnızca zihinsel değildir; beden de alarm moduna geçer: kalp çarpıntısı, göğüste sıkışma, nefes darlığı hissi, kas gerginliği (özellikle boyun-omuz), mide sorunları, titreme, terleme ve sürekli yorgunluk sık görülür. Bu belirtiler nedeniyle birçok kişi önce dahiliye veya kardiyolojiye başvurur; tetkikler temizse kaygıyı değerlendirmek önemlidir.

## Yaygın Kaygı Bozukluğu Türleri

- **Yaygın Anksiyete Bozukluğu (YAB):** Sağlık, iş, aile gibi birçok konuda sürekli ve kontrol edilemeyen endişe hâli.
- **Sosyal Kaygı Bozukluğu:** Yargılanma ve olumsuz değerlendirilme korkusuyla sosyal ortamlardan kaçınma.
- **Panik Bozukluk:** Tekrarlayan panik ataklar ve yeni atak geleceği korkusuyla yaşamı kısıtlama.
- **Fobiler:** Belirli nesne veya durumlara karşı orantısız korku (uçak, kapalı alan, iğne vb.).

## Kaygıyla Başa Çıkma: Neler İşe Yarar?

**Terapi, kaygı bozukluklarında en güçlü kanıta sahip müdahaledir.** Özellikle bilişsel davranışçı terapi (BDT), kaygıyı besleyen düşünce örüntülerini ve kaçınma davranışlarını sistematik biçimde çalışır. Birçok kişi görece kısa sürede belirgin rahatlama yaşar.

Günlük yaşamda destekleyici alışkanlıklar:

1. **Nefes düzenleme:** Yavaş, uzun nefes verişli (örneğin 4 saniye al, 6 saniye ver) nefes çalışmaları bedensel alarmı yatıştırır.
2. **Kafein ve uyaranları azaltın:** Kafein, kaygı belirtilerini taklit eder ve şiddetlendirir.
3. **Düzenli hareket:** Haftada birkaç gün tempolu yürüyüş bile kaygı düzeyini ölçülebilir biçimde düşürür.
4. **Endişe saati tekniği:** Gün içine yayılmış endişelere, günde 15-20 dakikalık planlı bir "endişe zamanı" tanıyın; zihin gün içinde ertelemeyi öğrenir.
5. **Kaçınmayı azaltın:** Kaçındığınız her durum, kaygının alanını genişletir. Küçük adımlarla üstüne gitmek terapinin de temel ilkesidir.

## Ne Zaman Profesyonel Destek Almalısınız?

Kaygı birkaç aydır sürüyorsa, yaşam alanlarınızı daraltıyorsa veya bedensel belirtiler yoğunsa bir uzmana başvurmak için beklemenize gerek yok. Kaygı bozuklukları, tedaviye en iyi yanıt veren psikolojik durumlar arasındadır. [Kaygı alanında çalışan terapistleri Terapimap''te inceleyebilirsiniz](/tr/terapistler).',
  'psikolojik-konular',
  'Anksiyete (Kaygı) Bozukluğu: Belirtiler ve Tedavi | Terapimap',
  'Anksiyete bozukluğu nedir? Yaygın kaygı, sosyal kaygı ve diğer türlerin belirtileri, günlük hayata etkileri ve terapiyle başa çıkma yolları.',
  'published',
  true,
  '2026-07-08 01:11:30+00'
),(
  'Depresyon Belirtileri: Ne Zaman Profesyonel Destek Almalısınız?',
  'depresyon-belirtileri',
  'Depresyon geçici bir üzüntüden fazlasıdır. Duygusal, bilişsel ve bedensel belirtilerini, üzüntüden farkını ve ne zaman profesyonel destek almanız gerektiğini anlatıyoruz.',
  'Herkes zaman zaman üzülür, keyifsizleşir; bu insan olmanın parçasıdır. Depresyon ise geçici bir ruh hâli değil, duyguları, düşünceleri, bedeni ve davranışları etkileyen ciddi ancak **tedavi edilebilir** bir durumdur.

## Üzüntü ile Depresyonun Farkı

Üzüntü genellikle bir olaya bağlıdır, dalgalanır ve zamanla hafifler; araya keyif alınan anlar girer. Depresyonda ise çökkün duygudurum ve ilgi kaybı **günün büyük bölümünde, neredeyse her gün ve en az iki hafta** sürer. Eskiden keyif veren şeyler anlamını yitirir; "hiçbir şey hissetmiyorum" hâli üzüntünün kendisinden bile yaygın olabilir.

## Belirtiler

**Duygusal:** Sürekli çökkünlük, boşluk hissi, umutsuzluk, değersizlik ve suçluluk düşünceleri, kolay ağlama ya da ağlayamama.

**Bilişsel:** Konsantrasyon güçlüğü, karar verememe, unutkanlık, zihnin yavaşlamış hissi, karamsar düşünce döngüleri.

**Bedensel:** Uyku bozukluğu (uyuyamama ya da aşırı uyuma), iştah ve kilo değişimi, enerji düşüklüğü, açıklanamayan ağrılar, hareketlerde yavaşlama.

**Davranışsal:** Sosyal çekilme, sorumlulukları erteleme, öz bakımın azalması, işe/okula devamda zorlanma.

Belirtilerin türü ve şiddeti kişiden kişiye değişir; herkes aynı tabloyu yaşamaz.

## Neden Ben? — Depresyonun Nedenleri

Depresyon bir irade zayıflığı ya da karakter sorunu değildir. Genetik yatkınlık, beyin kimyası, kayıp ve travma yaşantıları, kronik stres, hormonal değişimler (doğum sonrası dönem gibi) ve bazı fiziksel hastalıklar bir araya gelerek zemin hazırlar. Kendinizi suçlamak, tabloyu yalnızca ağırlaştırır.

## Ne Zaman Profesyonel Destek Almalısınız?

Şu durumlarda bir uzmana başvurmayı ertelemeyin:

- Belirtiler iki haftadan uzun süredir devam ediyorsa
- İş, okul veya ilişkileriniz belirgin biçimde etkileniyorsa
- "Kimseye yük olmasam", "yok olsam" gibi düşünceler geçiyorsa
- Alkol veya madde kullanımıyla kendinizi rahatlatmaya başladıysanız

**Önemli:** Kendinize zarar verme düşünceleriniz yoğunlaşıyorsa bunu güvendiğiniz biriyle hemen paylaşın ve vakit kaybetmeden bir ruh sağlığı uzmanına ya da en yakın sağlık kuruluşuna başvurun.

## Tedavi Gerçekten İşe Yarıyor mu?

Evet. Depresyon, hakkında en çok araştırma yapılmış ve tedavisi en iyi tanımlanmış psikolojik durumlardan biridir. Hafif ve orta düzey depresyonda **psikoterapi** tek başına etkili olabilir; orta-ağır tablolarda **terapi ile ilaç tedavisinin birlikte** yürütülmesi en güçlü sonuçları verir. İlaç gerekip gerekmediğine psikiyatrist karar verir; terapi süreciyle birlikte yürütülebilir.

## Bugün Atabileceğiniz Küçük Adımlar

1. Tek ve küçük bir günlük hedef belirleyin (duş almak, 10 dakika yürümek) — depresyonda küçük adımlar büyüktür.
2. Güvendiğiniz bir kişiye nasıl hissettiğinizi anlatın; yük değil, bağ kurarsınız.
3. Uyku saatlerinizi sabitlemeye çalışın.
4. Ve en önemlisi: profesyonel destek için ilk adımı atın. [Depresyon alanında çalışan uzmanları Terapimap''te bulabilirsiniz](/tr/terapistler).

Depresyon, içinden tek başına "silkinip çıkılması" gereken bir durum değildir. Destek istemek güçsüzlük değil; iyileşmenin ilk adımıdır.',
  'psikolojik-konular',
  'Depresyon Belirtileri ve Destek Alma Zamanı | Terapimap',
  'Depresyon belirtileri nelerdir? Üzüntüden farkı, duygusal ve bedensel işaretler, ne zaman uzmana başvurulmalı? Kapsamlı depresyon rehberi.',
  'published',
  true,
  '2026-07-09 01:11:30+00'
),(
  'Panik Atak Anında Ne Yapmalı? Panik Bozukluk Rehberi',
  'panik-atak-aninda-ne-yapmali',
  'Panik atak korkutucudur ama tehlikeli değildir. Atak anında işe yarayan somut teknikleri, panik bozukluğun nasıl geliştiğini ve tedavi seçeneklerini bu rehberde bulabilirsiniz.',
  'Kalp deli gibi çarpıyor, nefes almak zorlaşıyor, "kalp krizi geçiriyorum" ya da "kontrolü kaybediyorum" düşüncesi zihni ele geçiriyor… Panik atak yaşayan hemen herkes ilk seferinde tıbbi bir acil durum yaşadığını düşünür. Oysa panik atak, **korkutucu ama tehlikesiz** bir alarm yanlışlığıdır.

## Panik Atak Nedir?

Panik atak, yoğun korku ve bedensel uyarılmışlığın dakikalar içinde zirveye ulaştığı bir dalgadır: çarpıntı, terleme, titreme, nefes darlığı, göğüste baskı, baş dönmesi, uyuşma, gerçekdışılık hissi ve ölüm/delirme korkusu. Tipik olarak **10 dakika içinde zirve yapar ve kendiliğinden söner** — beden bu düzeyde alarmı uzun süre sürdüremez.

Önemli ayrım: tek bir panik atak yaşamak panik bozukluk anlamına gelmez. **Panik bozukluk**, tekrarlayan ataklar ve "ya yine olursa" korkusuyla yaşamın kısıtlanmaya başlamasıdır.

## Atak Anında Ne Yapmalı?

1. **Kendinize durumu adlandırın:** "Bu bir panik atak. Korkutucu ama tehlikeli değil. Zirve yapacak ve geçecek." Bu tek cümle, alarmın üzerine ikinci bir alarm eklenmesini önler.
2. **Nefes verişinizi uzatın:** Panikte sorun genellikle hızlı ve sığ nefes almaktır (hiperventilasyon). 4 saniye burnundan al, 2 saniye tut, 6-8 saniyede ağızdan ver. Birkaç dakika sürdürün.
3. **5-4-3-2-1 topraklama tekniği:** Gördüğünüz 5 şeyi, dokunduğunuz 4 şeyi, duyduğunuz 3 sesi, aldığınız 2 kokuyu ve 1 tadı zihninizden adlandırın. Dikkat bedenden dış dünyaya döner.
4. **Kaçmayın, bekleyin:** Bulunduğunuz yerden kaçmak o anki kaygıyı düşürür ama beyne "orası tehlikeliydi" mesajı verir ve bir sonraki atağı besler. Güvenli bir noktada kalıp dalganın geçmesine izin vermek uzun vadede en güçlü stratejidir.
5. **Soğuk uyaran:** Yüze soğuk su çarpmak veya soğuk bir yüzeye dokunmak sinir sistemini yatıştırmaya yardımcı olabilir.

## Panik Döngüsü Nasıl Kurulur?

Panik bozukluğu sürdüren şey atakların kendisi değil, **atak korkusudur**. Bedensel bir duyum (çarpıntı, baş dönmesi) fark edilir → felaket olarak yorumlanır ("kalp krizi!") → korku bedensel belirtileri şiddetlendirir → yorum doğrulanmış gibi hissedilir. Zamanla kişi metro, asansör, kalabalık gibi "kaçışın zor olduğu" yerlerden kaçınmaya başlar; dünya küçülür.

## Tedavi: Döngü Kırılabilir

Panik bozukluk, psikoterapiye **en iyi yanıt veren** durumlardan biridir. Bilişsel davranışçı terapide bedensel duyumların felaketleştirilmesi çalışılır; kontrollü alıştırmalarla beden duyumlarına tahammül yeniden öğrenilir ve kaçınılan durumlara kademeli olarak dönülür. Gerektiğinde psikiyatrist eşliğinde ilaç tedavisi de sürece eklenebilir.

İlk atak sonrasında bir kez hekim değerlendirmesinden geçmek (kalp ve tiroid gibi tıbbi nedenlerin dışlanması) hem doğru hem rahatlatıcıdır. Tetkikler temizse, tekrar tekrar acile gitmek yerine psikolojik tedaviye yönelmek çözümün kendisidir.

## Yaşamınızı Geri Alın

Panik nedeniyle vazgeçtiğiniz her alan geri kazanılabilir. [Kaygı ve panik bozukluk alanında çalışan terapistleri Terapimap''te inceleyin](/tr/terapistler) — çoğu danışan, doğru destekle birkaç ay içinde belirgin özgürleşme yaşar.',
  'psikolojik-konular',
  'Panik Atak Anında Ne Yapmalı? | Terapimap',
  'Panik atak belirtileri neler, atak anında ne yapmalı? Nefes teknikleri, topraklama yöntemi ve panik bozukluk tedavisi hakkında kapsamlı rehber.',
  'published',
  true,
  '2026-07-10 01:11:30+00'
),(
  'Bilişsel Davranışçı Terapi (BDT) Nedir, Nasıl İşler?',
  'bilissel-davranisci-terapi-bdt-nedir',
  'BDT, dünyada en çok araştırılan ve en yaygın kullanılan terapi yaklaşımıdır. Düşünce-duygu-davranış üçgenini, seansların işleyişini ve kimler için uygun olduğunu anlatıyoruz.',
  'Bilişsel Davranışçı Terapi (BDT), dünyada üzerine en çok araştırma yapılmış psikoterapi yaklaşımıdır. Depresyondan kaygı bozukluklarına, uyku sorunlarından takıntılara kadar geniş bir alanda etkinliği kanıtlanmıştır. Peki BDT tam olarak nedir ve bir seans nasıl geçer?

## Temel Fikir: Düşünce–Duygu–Davranış Üçgeni

BDT''nin çıkış noktası şudur: bizi zorlayan çoğu zaman olayların kendisi değil, olaylara yüklediğimiz **anlamlardır**. Aynı durum — örneğin mesajınıza geç yanıt gelmesi — "beni önemsemiyor" diye yorumlandığında öfke ve küskünlük; "meşguldür herhalde" diye yorumlandığında nötr bir duygu üretir.

Düşünceler duyguları, duygular davranışları etkiler; davranışlar da geri dönüp düşünceleri pekiştirir. BDT bu döngünün herhangi bir noktasından girerek sistemi değiştirmeyi hedefler.

## BDT''de Neler Çalışılır?

- **Otomatik düşünceleri fark etmek:** Zihinden hızla geçen ve sorgulanmadan doğru kabul edilen yorumları yakalamayı öğrenirsiniz.
- **Düşünce hatalarını tanımak:** Felaketleştirme ("kesin kötü bir şey olacak"), ya hep ya hiç düşüncesi ("tam yapamıyorsam hiç yapmayayım"), zihin okuma ("benim hakkımda kötü düşünüyor") gibi yaygın çarpıtmalar tanınır.
- **Kanıt sorgulama:** Düşünce bir mahkemede sanık gibi ele alınır: "Bu yorumu destekleyen ve çürüten kanıtlar neler? Alternatif açıklama olabilir mi?"
- **Davranış deneyleri:** Yeni bakış açıları masa başında değil, gerçek yaşamda test edilir. Kaçınılan durumların üzerine kademeli ve planlı biçimde gidilir.
- **Beceri kazanımı:** Nefes düzenleme, problem çözme, iletişim becerileri gibi somut araçlar öğrenilir.

## Bir BDT Seansı Nasıl Geçer?

BDT yapılandırılmış bir terapidir. Tipik bir seansta önce kısa bir gündem belirlenir, geçen haftanın ödevi gözden geçirilir, gündemdeki konu üzerinde çalışılır ve seans yeni bir ev ödeviyle kapanır. Ödevler — düşünce kayıtları, küçük davranış deneyleri — terapinin etkisini seans odasından günlük yaşama taşıyan ana mekanizmadır.

Süreç genellikle **8-20 seans** aralığında planlanır; bu, BDT''yi görece kısa süreli ve hedef odaklı bir yaklaşım yapar.

## Hangi Durumlarda Etkili?

BDT''nin güçlü kanıta sahip olduğu alanlar arasında şunlar sayılır:

- Depresyon
- Yaygın kaygı, sosyal kaygı ve panik bozukluk
- Obsesif kompulsif bozukluk (OKB)
- Fobiler
- Uyku sorunları (uykusuzluk için özel protokolüyle)
- Sınav ve performans kaygısı

## BDT Kimler İçin Uygun?

Somut hedefleri olan, "neden böyleyim"den çok "bunu nasıl değiştiririm" sorusuna odaklanmak isteyen ve seanslar arasında aktif çalışma yapmaya açık kişiler BDT''den genellikle yüksek verim alır. Kökleri çocukluğa uzanan derin ilişkisel örüntüler içinse şema terapi gibi yaklaşımlar daha uygun olabilir — bu değerlendirmeyi uzmanınızla birlikte yaparsınız.

## BDT ile Çalışan Bir Uzman Bulun

[Terapimap''te](/tr/terapistler) bilişsel davranışçı terapi ile çalışan uzmanları inceleyebilir, uzmanlık alanlarına ve görüşme türüne göre filtreleyebilirsiniz.',
  'terapi-yontemleri',
  'Bilişsel Davranışçı Terapi (BDT) Nedir? | Terapimap',
  'Bilişsel Davranışçı Terapi (BDT) nasıl işler, hangi sorunlarda etkilidir, seanslar nasıl geçer? Kanıta dayalı BDT hakkında kapsamlı rehber.',
  'published',
  false,
  '2026-07-11 01:11:30+00'
),(
  'EMDR Terapisi Nedir? Travma Tedavisinde Nasıl Kullanılır?',
  'emdr-terapisi-nedir',
  'EMDR, travmatik anıların işlenmesini sağlayan, göz hareketleriyle çalışan kanıta dayalı bir terapi yöntemidir. Nasıl işlediğini, 8 aşamasını ve kimlere uygun olduğunu anlatıyoruz.',
  'EMDR (Eye Movement Desensitization and Reprocessing — Göz Hareketleriyle Duyarsızlaştırma ve Yeniden İşleme), özellikle travma sonrası stres belirtilerinde etkinliği kanıtlanmış, Dünya Sağlık Örgütü gibi otoritelerce travma tedavisinde önerilen bir psikoterapi yöntemidir.

## Temel Fikir: İşlenememiş Anılar

Beynimiz gündelik yaşantıları uyku ve doğal süreçlerle işler, anlamlandırır ve arşivler. Ancak aşırı yoğun ya da travmatik bir yaşantı, bu doğal işleme kapasitesini aşabilir. Anı; o anki görüntüler, sesler, beden duyumları ve "çaresizim", "suçluyum", "güvende değilim" gibi olumsuz inançlarla birlikte adeta **donmuş hâlde** depolanır. Bugünkü bir tetikleyici — bir koku, bir ses, benzer bir durum — bu ham anıyı canlandırdığında kişi olayı sanki yeniden yaşıyormuş gibi güçlü tepkiler verir.

EMDR''nin amacı, bu takılı kalmış anıların beynin doğal işleme mekanizmasıyla yeniden buluşmasını sağlamaktır.

## Göz Hareketleri Ne İşe Yarıyor?

EMDR sırasında terapist, siz anının belirli bir yönüne odaklanmışken **çift yönlü uyarım** uygular — genellikle gözlerinizle takip ettiğiniz parmak hareketleri, bazen sesli ya da dokunsal uyarımlar. Bu ikili görev sırasında anının duygusal yükü kademeli olarak azalır; anıya bağlı olumsuz inançlar ("değersizim") yerini daha gerçekçi ve işlevsel inançlara ("elimden geleni yaptım, artık güvendeyim") bırakır.

Sonuçta anı silinmez — ama sizi ele geçirme gücünü kaybeder. Danışanlar bunu sıklıkla "artık hatırlıyorum ama içimi acıtmıyor" diye tarif eder.

## EMDR''nin 8 Aşaması

EMDR yalnızca göz hareketlerinden ibaret değildir; yapılandırılmış bir protokol izler:

1. **Öykü alma ve planlama:** Çalışılacak anılar belirlenir.
2. **Hazırlık:** Güvenli yer egzersizi gibi duygu düzenleme becerileri öğretilir.
3. **Değerlendirme:** Hedef anı; görüntüsü, olumsuz inancı ve beden duyumuyla tanımlanır.
4. **Duyarsızlaştırma:** Çift yönlü uyarımla anının yükü işlenir.
5. **Yerleştirme:** Olumlu inanç güçlendirilir.
6. **Beden taraması:** Kalan bedensel gerginlikler çalışılır.
7. **Kapanış:** Seans güvenli biçimde sonlandırılır.
8. **Yeniden değerlendirme:** Sonraki seansta kazanımlar kontrol edilir.

## Hangi Durumlarda Kullanılır?

En güçlü kanıt travma sonrası stres bozukluğundadır: kazalar, doğal afetler, kayıplar, şiddet ve istismar yaşantıları, zorlu doğum deneyimleri. Bunun yanında tek olaya bağlı fobiler, yas, panik ve performans kaygısında da yaygın olarak kullanılır.

## Kaç Seans Sürer?

Tek ve yetişkinlikte yaşanmış bir travmada görece kısa sürede (birkaç seansta) sonuç alınabilir; çocukluktan gelen tekrarlayan travmalarda hazırlık aşaması daha uzun tutulur ve süreç aylara yayılabilir.

## Önemli: Eğitimli Uzman Şart

EMDR, yalnızca akredite EMDR eğitimini tamamlamış ruh sağlığı uzmanlarınca uygulanmalıdır. [Terapimap''te](/tr/terapistler) travma ve EMDR alanında çalışan uzmanları inceleyebilir, profillerinden eğitim bilgilerine ulaşabilirsiniz.',
  'terapi-yontemleri',
  'EMDR Terapisi Nedir, Nasıl İşler? | Terapimap',
  'EMDR terapisi nedir? Göz hareketleriyle duyarsızlaştırma yöntemi travmada nasıl çalışır, seanslar nasıl ilerler, kimler için uygundur?',
  'published',
  false,
  '2026-07-12 01:11:30+00'
),(
  'Şema Terapi Nedir? Kimler İçin Uygundur?',
  'sema-terapi-nedir',
  'Aynı tür ilişkilere, aynı çıkmazlara tekrar tekrar mı giriyorsunuz? Şema terapi, çocuklukta kurulan derin örüntüleri fark edip değiştirmeye odaklanan bütüncül bir yaklaşımdır.',
  '"Neden hep aynı tip insanlara âşık oluyorum?", "Ne kadar başarsam da kendimi yetersiz hissediyorum", "Hayır diyemiyorum, herkesi memnun etmeye çalışıyorum"… Bu cümleler size tanıdık geliyorsa, tekrar eden bir **yaşam örüntüsünün** içinde olabilirsiniz. Şema terapi tam da bu örüntülerle çalışmak için geliştirilmiştir.

## Şema Nedir?

Şemalar; çocukluk ve ergenlik döneminde, temel duygusal ihtiyaçlarımız yeterince karşılanmadığında oluşan **derin, yaygın ve kalıcı inanç-duygu kalıplarıdır**. Kendimize, ilişkilere ve dünyaya bakışımızın görünmez gözlükleridir. Örneğin:

- **Terk edilme şeması:** "Sevdiğim insanlar eninde sonunda beni bırakır."
- **Kusurluluk şeması:** "Gerçek hâlimi görseler beni sevmezler."
- **Yüksek standartlar şeması:** "Yaptığım hiçbir şey yeterince iyi değil."
- **Boyun eğicilik şeması:** "Kendi ihtiyaçlarımı öne koyarsam cezalandırılırım ya da terk edilirim."
- **Duygusal yoksunluk şeması:** "Kimse beni gerçekten anlamaz ve duygusal ihtiyaçlarımı karşılamaz."

Şemalar acı verir ama tanıdıktır; bu yüzden farkında olmadan onları **doğrulayan** ilişkiler ve durumlar seçeriz. Terk edilme şeması olan kişinin mesafeli partnerlere yönelmesi gibi.

## Şema Modları: Anlık Hâllerimiz

Şema terapi yalnızca kalıpları değil, o anki duygusal hâllerimizi de çalışır. Zorlandığımız anlarda içimizde farklı "modlar" devreye girer: incinmiş **çocuk modu**, bizi eleştiren **cezalandırıcı iç ses**, duyguları uzaklaştıran **kopuk korungan mod** ve sağlıklı kararlar alabilen **sağlıklı yetişkin modu**. Terapinin amacı, sağlıklı yetişkin modunu güçlendirmektir.

## Şema Terapide Neler Yapılır?

Şema terapi bütüncül bir yaklaşımdır; bilişsel, duygusal ve davranışsal teknikleri birlikte kullanır:

1. **Şemaların keşfi:** Ölçekler ve yaşam öyküsü çalışmasıyla baskın şemalarınız belirlenir.
2. **Duygusal çalışma:** İmgeleme egzersizleriyle şemanın kurulduğu erken yaşantılara gidilir; o günün karşılanmamış ihtiyacı bugünün güvenli ortamında onarılır.
3. **Sınırlı yeniden ebeveynlik:** Terapist, terapötik sınırlar içinde, çocuklukta eksik kalan onay, güven ve şefkat deneyimini sağlar.
4. **Kalıp kırma:** Şemanın günlük yaşamdaki tekrarları yakalanır ve yeni davranışlar adım adım denenir.

## Kimler İçin Uygundur?

Şema terapi özellikle şu durumlarda güçlü bir seçenektir:

- Tekrarlayan ilişki sorunları ve partner seçimlerinde döngüler
- Kronik değersizlik, yetersizlik ve suçluluk duyguları
- Klasik kısa süreli terapilerden yeterince yarar görememiş, uzun süredir devam eden sorunlar
- Mükemmeliyetçilik ve tükenmişlik döngüleri
- Kişilik örüntülerinden kaynaklanan zorluklar

Süreç, derinlemesine çalışmanın doğası gereği BDT''den daha uzundur; genellikle aylar, bazen birkaç yıl sürer. Karşılığında hedef, belirtileri geçici olarak azaltmak değil **örüntünün kendisini değiştirmektir**.

## Şema Terapistleri

[Terapimap''te](/tr/terapistler) şema terapi eğitimi almış uzmanları inceleyebilir, size uygun olanıyla ilk değerlendirme görüşmesini planlayabilirsiniz.',
  'terapi-yontemleri',
  'Şema Terapi Nedir, Kimler İçin Uygundur? | Terapimap',
  'Şema terapi nedir? Erken dönem uyumsuz şemalar, şema modları ve tekrarlayan yaşam örüntülerini değiştirmeye odaklanan bu yaklaşımın kapsamlı rehberi.',
  'published',
  false,
  '2026-07-13 01:11:30+00'
),(
  'Çocuğunuz İçin Psikolog Seçerken Dikkat Edilmesi Gerekenler',
  'cocuk-icin-psikolog-secimi',
  'Çocuğunuz için doğru uzmanı seçmek yetişkin terapisinden farklı kriterler gerektirir. Çocuk alanında uzmanlık, oyun terapisi, aile iş birliği ve süreçte ebeveynin rolünü anlatıyoruz.',
  'Çocuğunuzun desteğe ihtiyaç duyduğunu fark etmek hem endişe hem de çaresizlik hissi yaratabilir. Doğru uzmanı bulmak bu sürecin en kritik adımıdır — çünkü çocuklarla çalışmak, yetişkin terapisinden farklı bir uzmanlık gerektirir.

## Ne Zaman Bir Uzmana Başvurmalı?

Her davranış sorunu terapi gerektirmez; çocukluk dönemi doğası gereği iniş çıkışlıdır. Ancak şu işaretler bir değerlendirmeyi anlamlı kılar:

- Davranış veya duygu durumundaki değişim **birkaç haftadan uzun** sürüyorsa (içe kapanma, öfke patlamaları, sürekli ağlama)
- Uyku, iştah veya tuvalet alışkanlıklarında gerileme varsa
- Okul başarısında ani düşüş ya da okula gitmeyi reddetme görülüyorsa
- Arkadaş ilişkilerinde belirgin sorunlar yaşanıyorsa
- Taşınma, boşanma, kayıp, kardeş doğumu gibi bir yaşam olayı sonrası uyum zorlanıyorsa
- Yaşına uygun olmayan yoğun korkular ve kaygılar varsa

## Çocuk Alanında Uzmanlık Şart

İlk ve en önemli kriter: uzmanın **çocuk ve ergenlerle çalışma eğitimi ve deneyimi** olmalıdır. Yetişkinlerle çalışan her terapist çocukla çalışamaz. Şunlara bakın:

- Klinik psikoloji yüksek lisansı ve tercihen çocuk-ergen alanında yoğunlaşma
- **Oyun terapisi**, çocuk merkezli terapi, filial terapi gibi çocuğa özgü yöntem eğitimleri
- Gerektiğinde kullanılmak üzere gelişim değerlendirme araçlarına hâkimiyet

Çocuklar duygularını yetişkinler gibi konuşarak ifade edemez; onların dili **oyundur**. Bu yüzden okul öncesi ve ilkokul çağında oyun terapisi eğitimi almış bir uzman büyük fark yaratır.

## İlk Görüşme Nasıl Olmalı?

Sağlıklı bir süreçte ilk görüşme genellikle **yalnızca ebeveynlerle** yapılır. Uzman; gelişim öyküsünü, aile yapısını, okul durumunu ve endişelerinizi dinler. Çocuğun süreci ise güven ilişkisi kurmaya odaklı, yumuşak bir tanışmayla başlar. İlk seansta çocuğunuzdan "her şeyi anlatmasını" bekleyen bir yaklaşım gerçekçi değildir.

## Ebeveyn Olarak Rolünüz

Çocuk terapisinde aile sürecin dışında değil, **içindedir**:

1. **Düzenli ebeveyn görüşmeleri:** İyi bir çocuk terapisti belirli aralıklarla sizinle görüşür; evde uygulanacak stratejileri paylaşır.
2. **Gizlilik dengesi:** Uzman, çocuğun size neyi aktaracağı konusunda baştan çerçeve çizer. Çocuğun seans içeriğinin birebir raporlanmaması, güven ilişkisinin gereğidir — güvenlik riski olan durumlar elbette istisnadır.
3. **Süreklilik:** Çocuklar rutinle güvende hisseder; seansları düzenli sürdürmek önemlidir.
4. **Etiketlemeden destekleyin:** Çocuğunuza terapiyi "sorunlu olduğu için gittiği bir yer" değil, "duygularını konuşabileceği, oyun oynayacağı özel bir zaman" olarak tanıtın.

## Dikkat Çeken Uyarı İşaretleri

Uzman size hiç geri bildirim vermiyorsa, kesin çözüm ve garantiler vaat ediyorsa, değerlendirme yapmadan uzun paketler satmaya çalışıyorsa ya da çocuğunuz aylardır seanslara direnç göstermeye devam ediyorsa süreci sorgulamaktan çekinmeyin. İkinci bir uzman görüşü almak her zaman hakkınızdır.

## Doğru Uzmanı Bulun

[Terapimap''te](/tr/terapistler) çocuk ve ergen alanında çalışan uzmanları şehrinize ve görüşme türüne göre filtreleyerek inceleyebilirsiniz. Erken ve doğru destek, çocuğunuzun tüm gelişimine yapılmış bir yatırımdır.',
  'cocuk-ve-ergen',
  'Çocuk Psikoloğu Seçerken Dikkat Edilmesi Gerekenler | Terapimap',
  'Çocuğunuz için psikolog nasıl seçilir? Çocuk alanında uzmanlık, oyun terapisi, ilk görüşme ve ebeveynin süreçteki rolü hakkında pratik rehber.',
  'published',
  true,
  '2026-07-14 01:11:30+00'
),(
  'Ergenlik Döneminde Ruh Sağlığı: Ebeveynler İçin İşaretler',
  'ergenlik-doneminde-ruh-sagligi',
  'Ergenlikte hangi davranışlar normal, hangileri destek gerektirir? Uyarı işaretlerini, ergenle iletişim kurmanın yollarını ve profesyonel desteğe yönlendirme sürecini anlatıyoruz.',
  'Ergenlik; beynin, bedenin ve kimliğin aynı anda yeniden inşa edildiği fırtınalı bir dönemdir. Kapı çarpmalar, "beni anlamıyorsunuz"lar, saatlerce kapalı kalan odalar… Peki hangisi bu dönemin doğal parçası, hangisi bir yardım çağrısı?

## Ergenlikte "Normal" Nedir?

Şunlar, zorlayıcı olsa da gelişimsel olarak beklenen davranışlardır:

- Aileden çok arkadaşlarına yönelme, mahremiyet ihtiyacının artması
- Duygu dalgalanmaları; kısa süreli öfke, alınganlık ve karamsarlık dönemleri
- Otoriteyi sorgulama, kuralları test etme
- Görünüşle yoğun ilgilenme, kimlik denemeleri (tarz, müzik, görüş değişimleri)

Buradaki anahtar kelimeler **geçicilik ve işlevselliktir**: ergen zorlanıyor ama okula gidiyor, arkadaşlıklarını sürdürüyor, keyif aldığı şeyler hâlâ var.

## Uyarı İşaretleri: Ne Zaman Endişelenmeli?

Aşağıdaki işaretler birkaç haftadan uzun sürüyor ve birden fazlası bir aradaysa profesyonel bir değerlendirme önemlidir:

- Sevdiği her şeyden çekilme: arkadaşlar, hobiler, spor dahil kalıcı içe kapanma
- Okul reddi veya başarıda ani ve sürekli düşüş
- Uyku ve yeme düzeninde belirgin bozulma (aşırı uyuma/uyuyamama, öğün atlama, gizli yeme)
- Bedeninde açıklanamayan yara ve izler, sürekli uzun kollu giyinme
- Ölüm ve yok olma temalı konuşmalar, "olmasam da olur" ifadeleri
- Alkol/madde kullanımına dair işaretler
- Süreğen umutsuzluk, değersizlik ifadeleri ve ağlama nöbetleri

**Önemli:** Kendine zarar verme veya intihar temalı her ifadeyi ciddiye alın. "Dikkat çekmek istiyor" varsayımı tehlikelidir; dikkat çekme ihtiyacının kendisi de bir yardım çağrısıdır. Böyle bir durumda vakit kaybetmeden bir ruh sağlığı uzmanına başvurun.

## Ergenle İletişim: Kapıyı Açık Tutmak

1. **Sorgu değil, sohbet:** "Neyin var senin?" yerine ortak aktiviteler sırasında (araba yolculuğu, yemek hazırlama) yan yana konuşmalar deneyin; göz teması baskısı olmayan anlarda ergenler daha kolay açılır.
2. **Duyguyu küçümsemeyin:** "Bunlar önemsiz şeyler, büyüyünce anlarsın" cümlesi kapıyı kapatır. "Bu sana gerçekten zor geliyor, anlıyorum" cümlesi açar.
3. **Çözüm dayatmadan dinleyin:** Çoğu zaman ergen akıl değil, anlaşılma arar. Tavsiyeden önce "Benim bir şey yapmamı mı istersin, sadece dinlememi mi?" diye sorabilirsiniz.
4. **Kendi kaygınızı yönetin:** Paniklemiş bir ebeveynle konuşmak ergen için ek yüktür. Gerekirse önce kendi desteğinizi alın.

## Terapiyi Nasıl Önerirsiniz?

Ergene terapiyi bir ceza ya da "bozukluk" mesajı olarak değil, bir kaynak olarak sunun: "Bazen ailene anlatmak zor olur, tarafsız biriyle konuşmak iyi gelebilir. Denemek ister misin?" Uzman seçiminde ergenin de söz sahibi olması (birkaç seçenek arasından seçmesi) süreci sahiplenmesini kolaylaştırır. İlk uzmanla uyum olmazsa vazgeçmeyin; doğru eşleşme birkaç deneme gerektirebilir.

## Destek Bir Zayıflık Değil

Ergenlik döneminde alınan doğru destek, yetişkinliğe taşınacak sorunları erken aşamada çözer. [Terapimap''te ergenlerle çalışan uzmanları inceleyebilirsiniz](/tr/terapistler) — hem ergen için hem de bu dönemi yönetmeye çalışan siz ebeveynler için.',
  'cocuk-ve-ergen',
  'Ergenlerde Ruh Sağlığı: Ebeveyn Rehberi | Terapimap',
  'Ergenlik döneminde hangi davranışlar normal, hangileri uyarı işareti? Ebeveynler için ergen ruh sağlığı, iletişim ve destek alma rehberi.',
  'published',
  true,
  '2026-07-15 01:11:30+00'
),(
  'Çocuklarda Sınav Kaygısı: Aileler Ne Yapabilir?',
  'cocuklarda-sinav-kaygisi',
  'Sınav kaygısı, çocuğun bildiklerini gösterememesine yol açan yaygın bir sorundur. Kaygının işaretlerini, aile tutumlarının etkisini ve evde uygulanabilecek somut stratejileri anlatıyoruz.',
  'Sınav dönemlerinde karın ağrıları, uykusuz geceler, "hepsini biliyordum ama sınavda unuttum" cümleleri… Sınav kaygısı, çocuğun bilgi eksikliğinden değil, **bildiğini gösterememesinden** kaynaklanan ve doğru yaklaşımla büyük ölçüde çözülebilen bir sorundur.

## Sınav Kaygısı Nasıl Görünür?

- **Bedensel:** Sınav öncesi karın ağrısı, mide bulantısı, baş ağrısı, uyku bozukluğu, iştah değişimi
- **Zihinsel:** "Kesin kötü yapacağım" felaket senaryoları, sınav sırasında zihnin boşalması, dikkat dağınıklığı
- **Duygusal:** Ağlama nöbetleri, huzursuzluk, sınav konusu açıldığında öfkelenme
- **Davranışsal:** Çalışmayı sürekli erteleme (kaygıdan kaçınma), ya da tam tersi — molasız, takıntılı çalışma

Bir miktar heyecan performansı artırır; sorun, kaygının performansı **bozacak** düzeye çıkmasıdır.

## Kaygının Görünmeyen Kaynağı: Beklentiler

Çocuklar sınavı çoğu zaman bir bilgi ölçümü olarak değil, **sevilme ve onaylanma testi** olarak yaşar. "Kötü not alırsam annem üzülür, babam kızar, değerim düşer" denklemi kurulduğunda her sınav bir kimlik sınavına dönüşür. Bu denklemin kurulmasında ailenin — çoğu zaman iyi niyetli — tutumları belirleyicidir:

- Notları kardeş ya da arkadaşlarla kıyaslamak
- Başarıyı ödüle, başarısızlığı sevgi geri çekmeye bağlamak
- "Bu sınav senin hayatını belirleyecek" gibi yükseltilmiş söylemler
- Ailenin kendi kaygısını çocuğa yansıtması (sınav sabahı evdeki gerginlik)

## Aileler Ne Yapabilir?

1. **Sonucu değil emeği övün:** "Kaç aldın?" yerine "Nasıl hissettin, hangi bölümler iyi gitti?" sorusu, değerin nottan bağımsız olduğu mesajını verir.
2. **Sevginizi nottan ayırın — açıkça söyleyin:** "Sınav sonucun ne olursa olsun seni seviyorum" cümlesi basit görünür ama çocuğun duymaya en çok ihtiyaç duyduğu cümledir.
3. **Kendi kaygınızı kontrol edin:** Sınav sabahı sakin bir kahvaltı, kapıda "sen elinden geleni yap, yeter" — evin duygusal iklimi çocuğun iç sesine dönüşür.
4. **Gerçekçi çalışma düzeni kurun:** Molalı, planlı ve uyku düzenini bozmayan bir program; gece yarılarına sarkan maratonlardan daha etkilidir.
5. **Nefes ve gevşeme egzersizleri öğretin:** Sınavdan önce ve sınav sırasında kullanılabilecek basit nefes teknikleri (yavaş ve uzun nefes verme) kaygı anında somut bir araç sağlar.
6. **Felaket senaryolarını birlikte sınayın:** "Kötü geçerse ne olur?" sorusunu birlikte sonuna kadar konuşmak, belirsiz korkuyu yönetilebilir bir düşünceye çevirir.

## Ne Zaman Profesyonel Destek Gerekir?

Kaygı; bedensel belirtilerle sık tekrarlıyorsa, çocuk sınavlara girmeyi reddetmeye başladıysa, performans ile bilgi arasındaki makas belirgin biçimde açıksa ya da kaygı sınav dışındaki alanlara da yayılıyorsa bir uzman değerlendirmesi faydalı olur. Sınav kaygısı, bilişsel davranışçı tekniklerle **kısa sürede ve yüksek başarıyla** çalışılabilen bir alandır.

[Terapimap''te çocuk ve ergenlerle çalışan, kaygı alanında deneyimli uzmanları bulabilirsiniz](/tr/terapistler).',
  'cocuk-ve-ergen',
  'Çocuklarda Sınav Kaygısı ve Aile Tutumları | Terapimap',
  'Çocuklarda sınav kaygısının belirtileri neler? Ailelerin yapması ve yapmaması gerekenler, evde uygulanabilir stratejiler ve destek alma zamanı.',
  'published',
  false,
  '2026-07-16 01:11:30+00'
),(
  'Çift Terapisi Nedir? Ne Zaman Başvurmalısınız?',
  'cift-terapisi-nedir',
  'Çift terapisi yalnızca ''son çare'' değildir. Seansların nasıl işlediğini, hangi sorunlarda etkili olduğunu ve terapiden verim almak için doğru zamanlamayı anlatıyoruz.',
  'Çift terapisi hakkındaki en yaygın yanılgı, onun "boşanmanın eşiğindeki çiftlerin son çaresi" olduğudur. Oysa araştırmalar tam tersini söylüyor: çiftler sorun yaşamaya başladıktan sonra ortalama **yıllarca** bekleyerek terapiye geliyor — ve bu gecikme, çözülebilecek sorunları kronikleştiriyor.

## Çift Terapisi Nedir?

Çift terapisi, ilişkideki iki kişinin **birlikte** katıldığı; iletişim örüntülerini, tekrarlayan çatışma döngülerini ve duygusal bağı çalışan yapılandırılmış bir terapi sürecidir. Kritik nokta şudur: terapistin danışanı iki kişiden biri değil, **ilişkinin kendisidir**. İyi bir çift terapisti taraf tutmaz, suçlu aramaz; iki tarafın da katkıda bulunduğu döngüyü görünür kılar.

## Hangi Sorunlarda Etkili?

- Sürekli tekrarlayan ve çözülemeyen tartışma döngüleri
- İletişimin azalması; "ev arkadaşı gibi yaşama" hissi
- Güven sarsılması ve aldatma sonrası onarım süreci
- Kıskançlık, mesafe ve bağlanma sorunları
- Cinsel yaşamda isteksizlik ve uyumsuzluk
- Aile büyükleri, ebeveynlik ve maddi konularda kronik anlaşmazlıklar
- Evlilik öncesi hazırlık ve büyük yaşam geçişleri (ebeveynlik, taşınma, emeklilik)

## Seanslar Nasıl İşler?

İlk seans(lar)da terapist ilişki öykünüzü dinler: nasıl tanıştınız, döngüler ne zaman başladı, her iki tarafın beklentileri neler. Bazı yaklaşımlarda birer bireysel değerlendirme seansı da yapılır. Ardından ortak hedefler belirlenir ve düzenli ortak seanslara geçilir.

Seanslarda tipik olarak şunlar çalışılır:

1. **Döngüyü tanımak:** "Sen eleştirince ben susuyorum, ben sustukça sen daha çok eleştiriyorsun" gibi kısır döngülerin haritası çıkarılır. Düşman partner değil, döngünün kendisidir.
2. **Duyguların altını görmek:** Öfkenin altındaki incinmişlik, susmanın altındaki yetersizlik korkusu gibi birincil duygular ifade edilmeye başlanır.
3. **Yeni iletişim becerileri:** Suçlamadan ihtiyaç dile getirme, savunmaya geçmeden dinleme gibi beceriler seans içinde denenir, evde sürdürülür.

## Ne Zaman Başvurmalı?

Altın kural: **"Bunu kendi başımıza çözemiyoruz" cümlesini birkaç aydır tekrar ediyorsanız, zamanı gelmiştir.** Aynı tartışmayı üçüncü kez aynı şekilde yapıyorsanız, döngü kendiliğinden kırılmayacak demektir. Erken başvuran çiftlerde başarı oranı belirgin biçimde daha yüksektir.

## Sık Sorulan Sorular

**Partnerim gelmek istemiyor, ne yapabilirim?** Tek başınıza bireysel terapiyle başlayabilirsiniz; ilişkideki bir kişinin değişimi çoğu zaman döngüyü de değiştirir. Partnerinize ise terapiyi "suçluyu bulma mahkemesi" değil, "ikimizin de rahatlayacağı bir alan" olarak anlatmak direnci azaltır.

**Terapist ayrılmamızı önerir mi?** Hayır; karar her zaman çiftindir. Terapist netleşmenize yardım eder — bu bazen ilişkiyi onarmak, bazen sağlıklı bir ayrılığı yönetmek anlamına gelir.

**Ne kadar sürer?** Hedefe göre değişir; yapılandırılmış süreçler genellikle birkaç ay sürer.

## İlk Adımı Birlikte Atın

[Terapimap''te çift ve ilişki terapisi alanında çalışan uzmanları inceleyebilirsiniz](/tr/terapistler). İlişkinize yapacağınız bu yatırım, çoğu zaman iki kişinin de bireysel iyilik hâline yapılmış bir yatırımdır.',
  'iliskiler',
  'Çift Terapisi Nedir, Ne Zaman Gidilmeli? | Terapimap',
  'Çift terapisi nasıl işler, hangi sorunlarda etkilidir, ne zaman başvurulmalı? Seans süreci ve sık sorulan sorularla kapsamlı çift terapisi rehberi.',
  'published',
  true,
  '2026-07-17 01:11:30+00'
)
on conflict (slug) do nothing;

-- Kontrol: 16 satır dönmeli
select slug, category, is_featured, published_at from public.articles order by published_at desc;
