# C2 — Karar Aşamasına Yakın, Uzun Kuyruk İçerik Listesi

**Amaç:** Şu ana kadarki rehber içerikleri ağırlıklı olarak "X nedir" tipi bilgilendirici
konulardan oluşuyor (arama hunisinin en üstü). C2, huninin altına — kullanıcı zaten bir sorunu
tanımlamış ve terapi almaya karar vermeye yakın — daha yakın, dönüşüm potansiyeli daha yüksek
konulara geçişi hedefliyor. Bu liste, her biri gerçek bir uzmanlık/şehir sayfasına doğal olarak
bağlanabilecek 18 konu önerisi içeriyor.

Her satırdaki `related_specialty`, `psikoloji-rehberi` skill'inin kullandığı **geçerli 63
slug'lık taksonomiden** seçildi — bu sayede yazılan makale otomatik olarak doğru
`/tr/terapistler/{sehir}/{uzmanlik}` sayfalarına linklenebilir. Bir konuyu üretmek istediğinde
bu skill'i doğrudan o konu adıyla çalıştırman yeterli.

## Öncelikli 8 (en yüksek dönüşüm potansiyeli)

| # | Başlık Önerisi | Karar Aşaması Niyeti | Kategori | related_specialty |
|---|---|---|---|---|
| 1 | Online mi Yüz Yüze mi? Terapi Formatını Nasıl Seçmeli | Format kararsızlığı — rezervasyon öncesi son engel | terapi-rehberi | *(boş — genel)* |
| 2 | Terapi Ücretleri Ne Kadar? Seans Fiyatını Etkileyen Faktörler | Fiyat şeffaflığı — en çok aranan "engel" sorgularından | terapi-rehberi | *(boş — genel)* |
| 3 | İlk Terapi Seansında Neler Olur? Adım Adım | Rezervasyon öncesi kaygı/belirsizlik giderme | terapi-rehberi | *(boş — genel)* |
| 4 | Çift Terapisine Ne Zaman Başlanmalı? 7 Uyarı İşareti | Karar tetikleyici — somut belirti listesi | iliskiler | cift-terapisi |
| 5 | Boşanma Sürecinde Terapi Almak: Ne Zaman ve Nasıl Yardımcı Olur | Kriz/karar anı, yüksek niyet | iliskiler | bosanma-ve-ayrilik |
| 6 | Sınav Kaygısı İçin Ne Zaman Profesyonel Destek Almalı | Veli/öğrenci karar anı, sezonsal trafik (Mayıs-Haziran) | cocuk-ve-ergen | sinav-kaygisi |
| 7 | Panik Atak Sonrası: Acil mi, Terapiye mi Gitmeli? | Yüksek kaygı anında karar netleştirme | psikolojik-konular | panik-bozukluk |
| 8 | Çocuğunuz İçin Ne Zaman Çocuk Psikoloğuna Başvurmalı | Ebeveyn karar anı, net yaş/belirti eşiği | cocuk-ve-ergen | cocuk-psikolojisi |

## İkinci sıra 10 (geniş kapsama + uzmanlık çeşitliliği)

| # | Başlık Önerisi | Karar Aşaması Niyeti | Kategori | related_specialty |
|---|---|---|---|---|
| 9 | Psikolog mu, Psikiyatrist mi? Hangi Durumda Kime Gitmeli | Yönlendirme kararsızlığı — çok aranan karşılaştırma | terapi-rehberi | *(boş — genel)* |
| 10 | EMDR Terapisi Kaç Seans Sürer? Sürece Dair Beklentiler | Yöntem seçimi öncesi süre/maliyet netleştirme | terapi-yontemleri | emdr |
| 11 | BDT (Bilişsel Davranışçı Terapi) Kimlere Uygun? | Yöntem-uygunluk eşleştirmesi | terapi-yontemleri | bilissel-davranisci-terapi-bdt |
| 12 | Tükenmişlik Sendromunda Terapi mi, İzin mi? Nasıl Karar Verilir | İş hayatı karar anı, LinkedIn/organik potansiyeli yüksek | psikolojik-konular | tukenmislik |
| 13 | Doğum Sonrası Depresyonda Ne Zaman Yardım Almalı: Anne ve Eşe Rehber | Yüksek duygusal aciliyet, eş dahil ikinci hedef kitle | cocuk-ve-ergen | dogum-sonrasi-depresyon |
| 14 | Evlilik/İlişki Danışmanlığı mı, Bireysel Terapi mi? Hangisi Önce | Format+odak kararsızlığı | iliskiler | iliski-sorunlari |
| 15 | Ergen Çocuğumu Terapiye Nasıl İkna Ederim | Ebeveynin pratik "nasıl" sorunu — uygulanabilir adımlar | cocuk-ve-ergen | ergen-terapisi |
| 16 | Bağımlılıkta Aile Bireyleri de Terapiye Katılmalı mı? | Aile karar süreci, ikincil dönüşüm | psikolojik-konular | bagimlilik |
| 17 | Uyku Sorunları Ne Zaman Psikolojik Desteğe İşarettir | Fiziksel/psikolojik ayrım, düşük rekabetli anahtar kelime | psikolojik-konular | uyku-sorunlari |
| 18 | Öz Güven Çalışması İçin Terapi Şart mı? Kendin Yapabileceklerinin Sınırı | "Kendim mi çözerim" itirazını terapiye yönlendirme | psikolojik-konular | ozguven |

## Kullanım notu

- Sıralama, mevcut terapist arzına (yoğun profesyon dağılımı: psikolog/psikiyatrist/psikolojik
  danışman) ve önceki GSC verisinde görülen arama davranışına göre kabaca önceliklendirildi;
  kesin sıralama için hedef anahtar kelimelerin arama hacmini GSC/Ads Keyword Planner'da teyit
  etmen faydalı olur.
- `related_specialty` boş bırakılan konular (1, 2, 3, 9) genel/karma konular — skill kuralı
  gereği zorlama bir uzmanlık eşleştirmesi yapılmıyor; bunlar yalnızca genel
  `/tr/terapistler` ve `/tr/psikoloji-rehberi` linkleriyle kapanacak.
- Bir konuyu üretmeye başlamak için: `psikoloji-rehberi` skill'ini o başlıkla çalıştırman
  yeterli — araştırma, yazım, tıbbi/etik denetim, SEO linkleme ve frontmatter otomatik
  yürüyecek, sana yalnızca son onay kalacak.
