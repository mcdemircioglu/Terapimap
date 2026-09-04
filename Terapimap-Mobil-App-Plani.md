# Terapimap — Mobil Uygulama Vizyonu & Uygulama Planı

_"Hem app hem site" — tek backend, çok istemci_

---

## 1. Temel İlke: Tek Backend, Çok İstemci

Terapimap'i "web mi, app mi" olarak düşünme. **Supabase (veritabanı, kimlik doğrulama, depolama, realtime) tek merkez;** web (Next.js) ve mobil (uygulama) bu merkezin iki istemcisidir. Aynı veri, aynı iş kuralları, iki farklı yüz.

İki yüzün rolü farklıdır ve birbirini tamamlar:

- **Web (site) = edinim motoru.** SEO buradan çalışır; Google trafiği, şehir + uzmanlık sayfaları, rehber içerikler hep web'de. App mağazada aranır ama Google'da içerik olarak taranmaz — o yüzden **web hep büyümenin kapısı kalır.**
- **App = etkileşim ve sadakat motoru.** Bildirim, görüntülü terapi, sohbet, ana ekranda ikon, tekrar kullanım. Danışan ve terapistin "geri gelme" yeri.

Akış: kullanıcı Google'da bulur → web'e gelir → "uygulamada aç / indir" → sürekli kullanım app'te. Bu ikisini **deep link (universal links / app links)** ile bağlarız; web'deki bir profil linki app'te aynı profili açar.

---

## 2. Neden Mobil App? (Web'in Veremediği)

- **Push bildirimleri:** Terapiste "yeni danışan talebi", danışana "randevu hatırlatma". Pazar yerinin can damarı; web'de bu kadar güçlü çalışmaz.
- **Görüntülü terapi:** Native kamera/mikrofon erişimi, mobil tarayıcıdan çok daha iyi seans deneyimi.
- **Sohbet & konuşma odaları:** Gerçek zamanlı, arka planda çalışan mesajlaşma.
- **Sadakat & keşif:** Ana ekranda ikon = tekrar kullanım; App Store/Play Store = yeni keşif kanalı.
- **Terapist tarafı mobil:** Uzman, profilini ve gelen talepleri telefondan yönetir.

---

## 3. Mimari Yaklaşım — Seçenekler ve Öneri

Mevcut yığın Next.js + TypeScript + Supabase olduğu için mobil tarafta da **React ekosisteminde kalmak** hem hız hem kod paylaşımı sağlar.

**Seçenekler:**

1. **PWA (Progressive Web App)** — mevcut siteyi "yüklenebilir" hale getirmek. Neredeyse sıfır maliyet, tek kod tabanı. Android'de push mümkün; iOS'ta sınırlı. Mağazada yok. → **Hızlı ilk adım.**
2. **Expo / React Native** — Supabase backend'ini paylaşan ayrı bir native app. Gerçek native deneyim, App Store + Play Store, push, video. İkinci kod tabanı ama Expo tek geliştirici için yönetilebilir. → **Stratejik hedef.**
3. **Capacitor (web sarmalayıcı)** — web app'i native kabuğa sarıp mağazaya sokmak. Orta yol; tek kod tabanına yakın ama native deneyim Expo kadar iyi değil.

**Öneri:** Önce **PWA** (ucuz kazanım), sonra gerçek app için **Expo / React Native.** Uzun vadede doğru yatırım Expo'dur; çünkü görüntülü terapi, push ve sohbet gibi vizyonundaki özellikler native ister.

**Kod paylaşımı (tek geliştirici için kritik):** Web ve app'i bir **monorepo** (Turborepo) altında topla; ortak paketlerde tut:

- Tipler ve veri modelleri (Supabase şeması)
- Supabase sorguları / API katmanı
- Doğrulama şemaları (zod)
- Tasarım tokenları (renk, tipografi) — **NativeWind** ile Tailwind sınıflarını React Native'de de kullanarak web ile görsel paritede kal.

Böylece iş mantığını iki kez yazmazsın; sadece arayüz katmanı ayrışır.

---

## 4. Teknoloji Seçimleri

| Katman | Web | Mobil App |
|---|---|---|
| Arayüz | Next.js + Tailwind | Expo (React Native) + NativeWind |
| Backend | Supabase (ortak) | Supabase (ortak) |
| Kimlik | Supabase Auth | Supabase Auth (aynı hesap) |
| Bildirim | — | Expo Push Notifications |
| Görüntülü görüşme | (opsiyonel) | Daily / LiveKit / Twilio Video SDK |
| Ödeme | Iyzico / Stripe | Iyzico/Stripe + mağaza kuralları (bkz. §7) |
| Dağıtım | Vercel | App Store + Google Play (EAS Build) |

---

## 5. Web ↔ App İlişkisi

- **SEO web'de kalır.** App içeriği aranmaz; o yüzden içerik/landing/rehber üretimi web'de devam eder — edinimin motoru budur.
- **Deep linking:** terapimap.com/tr/psikolog/{slug} → app yüklüyse app'te, değilse web'de açılır (universal links / app links).
- **"Uygulamada devam et" köprüleri:** web'de akıllı afiş; danışanı ve terapisti app'e taşı.
- **Tek hesap:** Supabase Auth sayesinde web'de doğrulayan terapist app'te aynı hesapla girer.

---

## 6. Fazlı Uygulama Planı

### Faz 0 — PWA (hızlı, ucuz) · web tabanı hazırken
Mevcut siteyi yüklenebilir hale getir: manifest, service worker, ikon seti, "ana ekrana ekle". Android'de temel push denemesi. Amaç: sıfıra yakın maliyetle "app hissi" ve öğrenme.

### Faz 1 — Expo MVP (dizin paritesi + sadakat) · gelir/talep oluşmaya başlayınca
- Supabase backend'ini paylaşan Expo app.
- Danışan: arama, filtreleme, profil görüntüleme, iletişime geçme, giriş.
- Terapist: profil yönetimi, doğrulama, **gelen talep push bildirimi.**
- Monorepo + NativeWind ile ortak tip/sorgu/token.
- App Store + Play Store'a ilk yayın.

### Faz 2 — Etkileşim katmanı (platformun kalbi)
- App içi mesajlaşma (Supabase realtime).
- Randevu/takvim.
- **Görüntülü terapi** (video SDK entegrasyonu).
- Ödeme akışı (mağaza kurallarına uygun — §7).

### Faz 3 — Topluluk & büyüme
- Konuşma odaları (moderasyonlu destek grupları).
- Etkinlik/atölye kaydı ve biletleme.
- Eğitim/sertifika ve konferans modülleri.

---

## 7. Kritik Dikkat Noktaları

- **Mağaza komisyonu & ödeme kuralları (çok önemli):** Apple/Google dijital içerikten %15–30 komisyon alır. Ancak **insan tarafından verilen gerçek-dünya hizmetleri** (bir terapistle canlı seans) genelde uygulama-dışı ödemeye izinli ve IAP zorunluluğundan muaftır. Seans komisyonu gelir modelini buna göre kurgula; yanlış kurgu %30'unu mağazaya kaptırır. Yayından önce güncel App Store/Play politikaları kontrol edilmeli.
- **Sağlık verisi & KVKK:** Terapi bağlamı hassas veri. Şifreleme, saklama, aydınlatma metni ve video görüşmelerinde gizlilik özenle ele alınmalı.
- **Tek geliştirici yükü:** İki kod tabanını sürdürmek maliyettir. Monorepo + ortak paketler + Expo OTA güncellemeleri bu yükü azaltır; yine de app'i ancak sürdürecek bant genişliğin/gelirin varken aç.
- **Maliyet:** Apple Developer 99$/yıl, Google Play 25$ (tek sefer). Push (Expo) başlangıçta ücretsiz. Video SDK ve ödeme kullanım bazlı.

---

## 8. Zamanlama — Dürüst Sıralama

App güzel bir vizyon ama **sırası önemli.** Bugün öncelik hâlâ web tarafında taban ve talep (doğrulanmış profiller, trafik, ilk gelir). App, elde tutacak bir kullanıcı kütlesi ve etkileşim oluşunca değer kazanır — aksi halde indirilip unutulur.

Pratik sıralama:
- **Şimdi:** Faz 0 PWA (ucuz, düşük risk) + web'de büyümeye devam.
- **Gelir/etkileşim sinyali gelince (Faz 2 dönemi):** Expo MVP.
- **Platform olgunlaşınca:** video, sohbet, topluluk app'e taşınır.

Yani app, gelir yol haritasındaki **Faz 2–3'ün doğal taşıyıcısı** — bağımsız bir proje değil, aynı vizyonun mobil yüzü.

---

## 9. İlk Somut Adımlar

1. Web'i **PWA** yap (manifest + service worker + ikonlar) — hızlı kazanım.
2. Repoyu **monorepo**'ya (Turborepo) taşımaya hazırlan; ortak tip/sorgu/token paketini ayır.
3. **Deep linking** altyapısını planla (universal links / app links).
4. Expo MVP kapsamını netleştir (dizin paritesi + terapist push).
5. Mağaza hesaplarını (Apple Developer, Google Play) ve ödeme/komisyon stratejisini araştır.

---

### Özet cümle
**Tek backend (Supabase), iki yüz: web edinim ve SEO motoru olarak kalır, app etkileşim ve sadakat motoru olur. Önce ucuz PWA ile başla, gelir/etkileşim oluşunca Expo ile gerçek app'e geç, video-sohbet-topluluğu oraya taşı. App bağımsız bir hedef değil, gelir vizyonunun mobil taşıyıcısı.**
