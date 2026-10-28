# SEO kontrol kataloğu

Her kontrolün yanında **varsayılan önem** verilmiştir. Etki alanına göre bir üst ya da alt dereceye çekilebilir.
Kuralın gerekçesi bu dosyada değil, `.claude/rules/public-pages-seo.md` dosyasındadır. Burada yalnızca **nasıl doğrulanacağı** yazılıdır.

Ortak terimler:
- **Public sayfa:** `src/app/[locale]/**/page.tsx` dosyaları, `dyn/` hariç.
- **Page-view:** `src/lib/page-views/*.tsx`. Statik sayfa ve `dyn` varyantı aynı view'i ve aynı `generateMetadataImpl` fonksiyonunu kullanır. Metadata kontrolü view dosyasında yapılır.

---

## A. Rota ve middleware (`src/middleware.ts`)

### A1: `RESERVED_TOP_SEGMENTS` eksiksiz mi? (Yüksek)
- `src/app/[locale]/` altındaki, köşeli parantezle başlamayan klasörleri listele (Glob: `src/app/[[]locale]/*/page.tsx` ve alt klasörler).
- Middleware'deki `RESERVED_TOP_SEGMENTS` kümesiyle karşılaştır.
- **Beklenen istisnalar:**
  - `terapistler` klasör değildir, `next.config.mjs` rewrite'ıdır. Listede bulunması doğrudur.
  - `panel` `[locale]` dışındadır. Listede bulunması zararsızdır.
- Klasörü olup listede olmayan her segment bulgudur. Sınıflandırma iki ayrı bulgu olarak yapılır:
  - **Rewrite: Doğrulanmış hata.** `/tr/<segment>?page=N` isteğinin `dyn/s/<segment>` rotasına rewrite edildiği `src/middleware.ts` kodundan kesin olarak çıkarılabiliyorsa (liste eksik, `rewriteToDynamic` koşulu sağlanıyor), bu doğrulanmış hatadır. Önem derecesi, sayfanın `?page` okuyup okumadığına ve sayfaya `?page` linki verilip verilmediğine göre belirlenir.
  - **Sonuç (ör. 404): Olası risk.** Rewrite edilen isteğin 404 mü yoksa yanlış içerik mi döndüğü, `parseSeoSlug` ve veritabanındaki uzmanlık kayıtlarına bağlıdır. Canlı test ya da veritabanı doğrulaması olmadan kesin hata olarak sınıflandırılmaz. "Doğrulamak için" sütununa canlı adres testi yazılır.

### A2: `DYN_QUERY_KEYS` view'lerle uyumlu mu? (Orta)
- `src/lib/page-views/*.tsx` içinde `searchParams.<anahtar>` kullanımlarını Grep ile bul.
- Kullanılan her anahtar `DYN_QUERY_KEYS` içinde olmalı. Yoksa o filtre statik sayfada sessizce yok sayılır.

### A3: ISR sayfası `searchParams` okuyor mu? (Orta)
- `export const revalidate` tanımlı public sayfalarda `searchParams` kullanımını ara.
- Okuyorsa sayfa ISR yerine dinamik render'a düşebilir. Kesin sonuç build çıktısıyla (H) doğrulanır. Build yoksa "Olası risk" olarak raporlanır.

### A4: `/dyn/` rotasına iç link var mı? (Orta)
- `src/` içinde `/dyn/` geçen `href`, `Link` ve URL üretimlerini Grep ile ara. Middleware ve `dyn` klasörünün kendisi hariç tutulur.

---

## B. Metadata

### B1: Her public sayfada title, description ve canonical var mı? (Yüksek)
- Sayfada ya da kullandığı page-view'de `generateMetadata`/`generateMetadataImpl` ya da `export const metadata` aranır.
- `title`, `description` ve `alternates.canonical` alanları kontrol edilir.
- Yalnızca layout metadata'sına dayanan sayfa (ör. ana sayfa) ayrıca not edilir.

### B2: Canonical doğru üretiliyor mu? (Yüksek)
- Canonical değeri `absUrl()` (`src/lib/schema.ts`), `landingCanonical()` (`src/lib/seo-landing.ts`) ya da `getProfessionalUrl()`/`getTherapistsListPath()` (`src/lib/utils.ts`) ile üretilmeli.
- Canonical'da query string, `/dyn/`, `/therapists` ya da `/en/` bulunmamalı.
- Sayfalı varyantlarda canonical'ın 1. sayfayı mı yoksa kendisini mi gösterdiği raporlanır. Bu bir politika kararıdır, hata olarak değil bilgi olarak geçer.

### B3: EN alternate kalıntısı var mı? (Düşük)
- `alternates.languages`, `hreflang` ve `'en'` alternate üretimini Grep ile ara.

### B4: Ana sayfa ve layout canonical'ı (Orta)
- `src/app/[locale]/layout.tsx` ve `src/app/[locale]/page.tsx` dosyalarında canonical tanımı aranır.

---

## C. İndekslenebilirlik

### C1: Sayfalı sayfalarda noindex (Orta)
- `robots:` tanımlayan her view'de sayfa numarası koşulu var mı (`page === 1`, `pageNo === 1`)?
- Aynı tür view'ler arasındaki tutarsızlık (biri kontrol ediyor, diğeri etmiyor) bulgudur.

### C2: Sitemap ile robots aynı kuralı mı uyguluyor? (Yüksek)
- `src/app/sitemap.xml/route.ts` dosyasındaki dahil etme koşullarını, ilgili view'lerin `robots.index` koşullarıyla karşılaştır.
- Kontrol edilecek eşik ve bayraklar: `MIN_THERAPISTS_FOR_INDEX`, `isIndexable`, veritabanı kaynaklı `is_indexable` (`src/lib/seo-landing.ts`).
- Veritabanı değerleri okunamadığı için, bayrak sitemap'te hiç dikkate alınmıyorsa durum "Olası risk" olarak raporlanır ve doğrulama adımı yazılır.

### C3: Özel alanlar korunuyor mu? (Düşük)
- `admin`, `panel`, `profil-dogrula`, `iletisime-gectim` layout'larında `robots: { index: false }` olmalı.
- `src/app/robots.ts` disallow listesi karşılaştırılır. Meta noindex varken disallow eksikse önem Düşük olur, yalnızca tarama bütçesini etkiler.

---

## D. Sitemap (`src/app/sitemap.xml/route.ts`)

### D1: Sitemap URL'leri gerçek rotalarla eşleşiyor mu? (Yüksek)
- Sitemap'teki her URL kalıbı için karşılık gelen rota ya da rewrite bulunmalı.
- Profil URL'leri `getProfessionalUrlSegment()` ile, liste URL'leri `terapistler` rewrite yolu ile üretilmeli.

### D2: Kullanılmayan sitemap dosyası (Bilgi)
- `src/app/sitemap.old.ts` dosyasının hiçbir yerden import edilmediğini Grep ile teyit et. Silinmesi önerilmez, yalnızca not düşülür.

### D3: `lastmod` anlamlı mı? (Düşük)
- Statik sayfalarda `new Date()` kullanımı her yeniden üretimde `lastmod` değerini değiştirir. Bilgi ya da Düşük olarak raporlanır.

---

## E. Redirect'ler (`next.config.mjs`)

Bu bölüm elle taranmaz. Script çalıştırılır:
```
node .claude/skills/seo-audit/scripts/check-redirects.js
```
Script dosyayı metin olarak okur, hiçbir kodu çalıştırmaz ve hiçbir dosyaya yazmaz. Çıktı kodlarının anlamı:

| Kod | Sınıf | Anlam |
|---|---|---|
| `E1-LOOP` | Doğrulanmış hata | Redirect döngüsü |
| `E1-CHAIN` | Doğrulanmış hata | Hedef başka bir redirect kaynağına düşüyor (zincir) |
| `E1-DUP` | Doğrulanmış hata / Bilgi | Aynı kaynak birden fazla kez tanımlı. İlk kayıt geçerli olur. |
| `E1-SHADOW` | Doğrulanmış hata | Daha önceki genel bir kayıt bu kaydı tamamen gölgeliyor |
| `E2-ROUTE` | Doğrulanmış hata | Hedefin rota segmenti `src/app/[locale]` altında yok |
| `E2-SEOSLUG` | Bilgi | Tek segmentli hedef `[seoSlug]` dinamik rotasına düşüyor |
| `E3-PERM` | Olası risk | `permanent: true` değil |
| `E4-SRC-RAW` | Olası risk | Kaynakta yüzde-kodlanmamış Türkçe karakter ya da boşluk var. Dosyadaki T7 notuna göre tarayıcı isteğiyle eşleşmeyebilir. |
| `E4-DEST` | Olası risk | Hedef slug biçimi şüpheli (ASCII dışı, boşluk, büyük harf, `--`, sonda `-`) |
| `E5-ROUTE-SHADOW` | Bilgi | Genel bir kaynak, var olan bir rota klasörünü tamamen yönlendiriyor (o sayfalar erişilemez) |

- Hedef profil slug'larının veritabanında var olup olmadığı script ile doğrulanamaz. Bu, raporda "denetlenmeyen" olarak belirtilir.
- **Çözüm önerisi asla mevcut kaydı silmek ya da değiştirmek olmaz.** Zincirler için önerilen çözüm, yeni ve doğrudan bir kaydı ilgili kaydın üstüne eklemektir. Bu önerinin uygulanıp uygulanmayacağına kullanıcı karar verir.

---

## F. İç linkler

### F1: Elle yazılmış eski yollar (Orta)
- `src/` içinde `'/therapists`, `"/therapists`, `` `/therapists `` ve `/therapist/` kalıplarını Grep ile ara.
- Hariç tutulanlar: `src/middleware.ts`, `next.config.mjs`, `src/app/[locale]/therapists/**` rota dosyaları ve `getTherapistsListPath()` uygulaması.

### F2: Profil linkleri yardımcı fonksiyonla mı üretiliyor? (Orta)
- `href` içinde `/psikolog/`, `/psikiyatrist/`, `/psikolojik-danisman/`, `/aile-terapisti/` ya da `/cocuk-psikiyatristi/` geçen ve `getProfessionalUrl()` kullanmayan yerler.

---

## G. Yapısal veri (JSON-LD)

### G1: JSON-LD yalnızca `src/lib/schema.ts` üreticileriyle mi ekleniyor? (Düşük)
- `application/ld+json` ve `JsonLd` bileşeni kullanımlarını bul. Elle yazılmış `@context` nesneleri bulgudur.

### G2: Sayfa türüne uygun şema (Orta)
| Sayfa türü | Beklenen üretici |
|---|---|
| Profil | `buildTherapistSchema` + `buildBreadcrumbSchema` |
| Liste ve landing | `buildItemListSchema` ya da `buildCollectionPageSchema` |
| Makale | `buildArticleSchema` |
| SSS bölümü olan sayfa | `buildFaqSchema` |
| Site geneli | `buildOrganizationSchema` |

---

## H. Build çıktısı (yalnızca kullanıcı onayıyla)
- `npm run build` uzun sürer ve `.next/` dizinine yazar. Çalıştırmadan önce kullanıcıdan onay alınır.
- Build çıktısındaki rota işaretleri (statik, ISR ya da dinamik), `docs/ARCHITECTURE.md` içindeki ISR tablosuyla karşılaştırılır. A3 bulguları burada kesinleşir.
