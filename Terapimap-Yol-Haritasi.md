# Terapimap.com — Yol Haritası ve Gelir Projeksiyonu

Hazırlanma tarihi: 11 Haziran 2026
Varsayımlar: Tek kişi, tam zamanlı; aylık bütçe 0–5.000 TL.

---

## 1. Mevcut Durumun Eleştirisi

**Doğru yapılanlar:** Niş odak (sadece mental sağlık) doğru — DoktorTakvimi tüm doktorları kapsıyor, sen derinleşebilirsin. SEO-slug yapısı ve Supabase tercihi de doğru.

**Kritik sorunlar:**

1. **Manuel veri girişi en büyük darboğazın.** 600 kaydı elle girmek günlerini yiyor ve ölçeklenemez. Bunun yerine: Python ile temizleme/doğrulama scripti (telefon formatı, unvan kontrolü, duplicate tespiti) → Supabase'e toplu import → sadece örneklem üzerinden el ile spot kontrol. Hedefin 5.000+ kayıtsa elle giriş matematiksel olarak imkansız.

2. **KVKK riski.** Scraping ile topladığın veriler kişisel veri. Kamuya açık olsa bile aydınlatma yükümlülüğün ve silme talebi sürecin olmalı. Çözüm aynı zamanda fırsat: her profile "Bu profili sahiplenin" butonu koy — hem hukuki pozisyonunu güçlendirir hem de birincil lead motorun olur.

3. **İki iş modelini ayır.** Directory (trafik/güven motoru) ve AI otomasyon (gelir motoru) farklı işler. Directory'den ilk yıl ciddi para bekleme; onu otomasyon satışı için lead kaynağı ve güvenilirlik vitrini olarak kullan.

4. **Tavuk-yumurta problemi.** Trafiğin yokken terapist ödeme yapmaz. Sıralama: önce ücretsiz profiller + SEO trafiği → sonra "profilinize X kişi baktı, Y kişi telefonunuzu istedi" verisiyle ücretli paket sat.

---

## 2. Veri ve SEO Stratejisi — "Ne kadar veri girmeliyim?"

Kısa cevap: **ham profil sayısı değil, indexlenebilir kaliteli sayfa sayısı** trafiği belirler.

- **Hedef veri:** 6 ay içinde 5.000 profil (İstanbul, Ankara, İzmir, Bursa, Antalya öncelikli). 600 profil SEO için çok az; Google bu hacimde siteyi "ince içerik" sayar.
- **Programatik SEO sayfaları:** Şehir × ilçe × uzmanlık kombinasyonları: "Kadıköy psikolog", "Ankara EMDR terapisti", "İzmir çift terapisti", "online terapi fiyatları". 81 il + büyük ilçeler + ~15 uzmanlık ≈ binlerce long-tail sayfa. Asıl trafik buradan gelir.
- **Thin content'ten kaçın:** Her listeleme sayfasına benzersiz giriş metni, SSS bloğu (FAQ schema), ortalama seans ücreti bilgisi ekle. Profil sayfalarına Physician/LocalBusiness schema markup koy.
- **Destek içerik:** Haftada 2 blog yazısı ("Psikolog mu psikiyatrist mi?", "EMDR nedir?", "2026 terapi seans ücretleri"). Bu yazılar listeleme sayfalarına internal link versin.
- **Teknik:** Google Search Console kur, sitemap gönder, Core Web Vitals'ı ölç. İlk 3 ay her hafta indexlenme oranını takip et.

**Beklenti yönetimi:** SEO 4–6 ayda sonuç verir. Ay 6'da aylık 10–20 bin organik ziyaret gerçekçi bir hedef (rekabete bağlı).

---

## 3. Lead Yakalama (Terapist Kazanımı)

**Ana motor — profil sahiplenme funnel'ı:**

1. Scraped profil yayında, üstünde "Doğrulanmamış profil" rozeti.
2. Terapiste e-posta/Instagram DM: "Terapimap'te profiliniz var, ücretsiz sahiplenin ve bilgilerinizi güncelleyin."
3. Sahiplenen terapiste 2 hafta sonra istatistik maili: "Profiliniz 340 kez görüntülendi, 12 kişi iletişim bilginizi açtı."
4. Bu veriyle premium paket teklifi.

**Cold outreach (günlük rutin, ücretsiz):**

- Günde 20 kişiselleştirilmiş e-posta + 10 Instagram DM. Şablon: tek cümle kişiselleştirme + "profiliniz hazır, tek tıkla sahiplenin" + link.
- Instagram'da aktif içerik üreten psikologlar en sıcak segment — görünürlüğe zaten yatırım yapıyorlar.
- Yeni mezun psikologlar (danışan bulma derdi en yüksek segment) ve şehir değiştiren terapistler.

**Danışan tarafı = terapist tarafının kanıtı:** Sitene "Sana uygun terapisti bul" mini anketi koy (uzmanlık, şehir, online/yüz yüze, bütçe). Form çıktısını eşleşen terapiste ilet. Terapiste giden her gerçek danışan talebi, satış konuşmandaki en güçlü argüman.

---

## 4. AI Otomasyon Ürünleri ve Fiyatlandırma

**Pazar doğrulaması:** DoktorTakvimi profesyonel üyeliği 4.799–6.399 TL+KDV/ay; üstüne AI not asistanı (Noa Notes) +2.500 TL/ay satıyor. Yani terapistler bu fiyat bandına alışkın — senin avantajın niş odak ve daha düşük fiyat.

**Ürün sıralaması (geliştirme kolaylığı + talep sırasına göre):**

1. **WhatsApp randevu ve hatırlatma botu** — no-show her terapistin somut para kaybı; en kolay satılan ürün. (Twilio/WhatsApp Business API + Supabase)
2. **Danışan ön-görüşme (intake) otomasyonu** — randevu öncesi form, AI özetiyle terapiste iletim.
3. **Seans notu AI asistanı** — ses kaydından/kısa nottan yapılandırılmış seans notu. (Noa Notes 2.500 TL/ay anchor'ı hazır.)
4. **Web sitesi + Google Business + SEO profili paketi** — tek seferlik kurulum geliri.
5. **Sosyal medya içerik otomasyonu** — haftalık içerik takvimi + AI taslaklar.

**Fiyat tablosu (önerilen):**

| Paket | İçerik | Fiyat |
|---|---|---|
| Ücretsiz profil | Listeleme + doğrulama rozeti | 0 TL |
| Premium listeleme | Üst sıra, öne çıkan rozet, istatistik paneli, danışan talebi yönlendirme | 990 TL/ay |
| Otomasyon Başlangıç | WhatsApp hatırlatma + online randevu takvimi | 1.490 TL/ay |
| Otomasyon Pro | Başlangıç + intake otomasyonu + seans notu AI | 2.990 TL/ay |
| Otomasyon VIP | Pro + web sitesi + sosyal medya otomasyonu | 4.990 TL/ay |
| Kurulum (tek seferlik) | Web sitesi/bot kurulumu | 3.000–7.500 TL |

Premium listelemeyi otomasyon paketlerine bedava dahil et — directory, otomasyonun pazarlama kanalı olsun.

**Satış taktiği:** İlk 10 müşteriye "kurucu üye" fiyatı (%50, ömür boyu) ver; karşılığında referans ve görüş yazısı al. Satış görüşmesini "demo" olarak yap: terapistin kendi telefonuna WhatsApp botundan mesaj düşür, 5 dakikada ikna eder.

---

## 5. Pazarlama Planı (0–5.000 TL/ay bütçe)

Bütçen düşük olduğu için ağırlık **organik + outreach**. Adım adım:

**Ay 1–2: Temel**
- Veri pipeline'ını otomatikleştir, 2.000 profile çık.
- Programatik SEO sayfalarını yayına al, Search Console + sitemap.
- Instagram ve LinkedIn hesapları: hedef kitle terapistler. İçerik teması "muayenehaneni büyüt": danışan bulma, no-show azaltma, Google'da görünme.
- KVKK aydınlatma metni + profil silme süreci.

**Ay 2–4: Outreach + ilk gelir**
- Günde 20 e-posta + 10 DM sahiplenme kampanyası → hedef ay sonunda 150 sahiplenilmiş profil.
- Lead magnet: "Psikologlar için Danışan Bulma Rehberi" (PDF) → e-posta listesi büyüt.
- İlk 10 otomasyon müşterisi (kurucu fiyatıyla). WhatsApp botu MVP'sini bu 10 kişiyle rafine et.
- Bütçenin kullanımı: 2.000–3.000 TL Instagram reklamı sadece terapist hedefli (lead magnet'e), kalan API/araç maliyetleri.

**Ay 4–6: Ölçek**
- 5.000 profil, organik trafik büyümeye başlar.
- Görüş/başarı hikayeleri yayınla ("X psikolog no-show'unu %40 azalttı").
- Psikoloji öğrenci toplulukları ve mezun gruplarına webinar: "Mezuniyet sonrası danışan nasıl bulunur?" — ücretsiz, listene kayıt karşılığı.
- Referans programı: getiren terapiste 1 ay bedava.

**Ay 6–12: Para kazanma**
- Trafik verisiyle premium listeleme satışına ağırlık ver.
- Danışan talep formu hacmi arttıkça "lead başına ödeme" modelini test et (talep başına 100–200 TL).
- Blog trafiği üzerinden danışan tarafında marka bilinirliği; terapist tarafında "Terapimap'te olmak gerekir" algısı.

---

## 6. Gelir Projeksiyonu Özeti

Detay: `Terapimap-Projeksiyon.csv` (Excel'de açılır).

Baz senaryo, Ay 12 itibarıyla: ~50 premium listeleme (≈50.000 TL/ay) + ~18 otomasyon müşterisi (≈48.000 TL/ay) + kurulum gelirleri → **~100.000 TL MRR**. Muhafazakar senaryoda ~45.000 TL, iyimser senaryoda ~190.000 TL MRR. İlk anlamlı gelir Ay 3–4'te (kurucu üye otomasyon satışları), directory geliri ağırlıklı olarak Ay 6 sonrası.

**En önemli 3 metrik:** haftalık organik tıklama (Search Console), sahiplenilmiş profil sayısı, otomasyon demo→satış dönüşüm oranı.

---

## 7. Riskler

- **DoktorTakvimi/Hiwell rekabeti:** Onlar genel; sen terapist nişinde derinleş ve fiyatta altta kal.
- **KVKK:** Sahiplenme modeli + hızlı silme süreci şart. Bir hukukçuya tek seferlik aydınlatma metni danışmanlığı aldır.
- **Tek kişi riski:** Otomasyon müşterisi arttıkça destek yükü büyür; ürünleri self-service kurguya yaklaştır.
- **AI not asistanında veri hassasiyeti:** Seans içeriği sağlık verisidir (özel nitelikli). Açık rıza + Türkiye'de barındırma tercih et; bunu satış argümanına çevir ("verileriniz yurt dışına çıkmaz").
