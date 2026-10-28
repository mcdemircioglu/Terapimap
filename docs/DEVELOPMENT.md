# Geliştirme

## Kurulum
```bash
npm install
cp .env.example .env.local   # değerleri doldurun (bkz. aşağıdaki tablo)
npm run dev                  # http://localhost:3000 adresi /tr'ye yönlenir
```
Veritabanı, mevcut Supabase projesidir. Sıfırdan kurulum için SQL dosyalarının hangi sırayla çalıştırılacağı belirsiz, bkz. [DATABASE.md](DATABASE.md).

## Ortam değişkenleri
Değerler `.env.local` dosyasında tutulur ve bu dosya Git'e girmez. Aşağıdaki liste `src/**` içindeki `process.env` kullanımlarından çıkarıldı.

| Değişken | Kapsam | Kullanıldığı yer | Eksikse |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | public | `src/lib/supabase/*`, `src/middleware.ts`, OG görselleri | Uygulama çalışmaz |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public | `src/lib/supabase/*`, `src/middleware.ts`, OG görselleri | Uygulama çalışmaz |
| `SUPABASE_SERVICE_ROLE_KEY` | **yalnızca server** | `src/lib/supabase/server.ts` | `getServiceClient()` hata fırlatır (admin, yükleme ve form uçları) |
| `ADMIN_PASSWORD` | **yalnızca server** | `src/lib/admin/auth.ts`, `api/admin/auth` | Admin girişi imkânsız olur |
| `GMAIL_USER` | **yalnızca server** | `src/lib/email.ts` | Mail gönderimi hata fırlatır |
| `GMAIL_APP_PASSWORD` | **yalnızca server** | `src/lib/email.ts` | Mail gönderimi hata fırlatır |
| `NEXT_PUBLIC_SITE_URL` | public | layout, robots, sitemap, `schema.ts`, `email.ts`, admin leads | Varsayılan değere düşer: `https://terapimap.com` (bazı dosyalarda `http://localhost:3000`) |
| `NEXT_PUBLIC_GA_ID` | public | `cookie-consent/ConsentScripts.tsx` | Doğrulanmadı: büyük olasılıkla script yüklenmiyor |
| `NEXT_PUBLIC_CLARITY_PROJECT_ID` | public | `cookie-consent/ConsentScripts.tsx` | Doğrulanmadı: büyük olasılıkla script yüklenmiyor |
| `NEXT_PUBLIC_META_PIXEL_ID` | public | `cookie-consent/ConsentScripts.tsx` | Doğrulanmadı: büyük olasılıkla script yüklenmiyor |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | public | `components/WhatsAppButton.tsx` | Buton gösterilmez |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY` | public | `src/lib/maps.ts` | Doğrulanmadı: harita embed davranışı |
| `CAMPAIGN_FEATURED_UNTIL` | server | `src/lib/email.ts`, `api/admin/verification-requests/[id]` | Varsayılan `2027-01-01T00:00:00+03:00`. `off` değeri kampanyayı kapatır. |

`NEXT_PUBLIC_*` değişkenleri tarayıcıya gönderilir. Bu önek gizli anahtarlarda kullanılmaz.

## Komutlar
| Komut | Durum (2026-10-28) |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run typecheck` | `tsc --noEmit`, hatasız geçiyor |
| `npm run build` | Production build |
| `npm run lint` | **Çalışmıyor.** ESLint yapılandırma dosyası yok, `next lint` etkileşimli kurulum sorusuyla hata veriyor. |
| `npm run start` | Build sonrası sunucu |

Test altyapısı (unit veya e2e) yok.

## Önerilen geliştirme akışı
1. **Plan:** etkilenen katmanlar belirlenir (route, API, DB, SEO ve önbellek, e-posta, panel ve admin) ve kullanıcı onayı alınır.
2. **Uygulama:** mevcut yardımcılar yeniden kullanılır (`queries.ts`, `page-views/*`, `email.ts`, `spamGuard.ts`, `revalidatePublicPages.ts`, `utils.ts`).
3. **DB değişikliği gerekiyorsa** yeni bir SQL dosyası yazılır ([DATABASE.md](DATABASE.md) kuralları), kullanıcı bunu SQL Editor'da çalıştırır ve `src/types/database.ts` güncellenir.
4. **Doğrulama:** `npm run typecheck`. Route, önbellek ya da config değiştiyse `npm run build`. Ardından `npm run dev` ile elle kontrol yapılır.
5. **Commit ve push** kullanıcı tarafından ya da kullanıcının açık talebiyle yapılır. Deployment ayrıca onaylanır.

### Kontrol listesi
- Yeni tek segmentli public sayfa varsa `src/middleware.ts` içindeki `RESERVED_TOP_SEGMENTS` güncellendi mi?
- Profesyonel verisi değiştiyse ilgili `revalidate*` fonksiyonu çağrıldı mı?
- Yeni public POST ucunda `spamGuard` kullanıldı mı?
- Yeni admin ucunda `verifyAdminRequest`, yeni panel ucunda oturum ve sahiplik kontrolü var mı?
- Metinler `messages/tr.json` dosyasına mı eklendi?
- Dahili linkler `getProfessionalUrl()` ve `getTherapistsListPath()` ile mi üretildi?

## `scripts/import_professionals.py`
- CSV'den `professionals` (ve uzmanlık eşlemeleri) tablosuna veri aktarır.
- Kullanım: `pip install supabase python-dotenv`, ardından `python scripts/import_professionals.py <dosya.csv>`.
- Kimlik bilgilerini proje kökündeki `.env.local` dosyasından okur (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
- ⚠️ **Service-role anahtarıyla canlı veritabanına yazar.** Yalnızca bilinçli olarak ve kullanıcı tarafından çalıştırılır.

## Ortam notları
- **Windows ve PowerShell 5.1:** UTF-8 Türkçe metin konsolda bozuk görünür. `Set-Content` ve `Add-Content` varsayılan olarak ANSI yazar. Dosyalar editör ya da Claude'un Edit/Write araçlarıyla düzenlenmeli.
- Doğrulanmadı: proje dosyalarında Windows ReparsePoint özniteliği görülüyor (olası OneDrive senkronizasyonu). `node_modules` ve `.next` klasörlerinde senkron çakışmaları yaşanabilir.
- `.vscode/launch.json` dosyası `localhost:8080` adresini kullanıyor, Next.js ise 3000 portunda çalışıyor.

## Diğer klasörler
- `Claude outputs/`: önceki Claude oturumlarından kalan önizleme HTML'leri, içerik planı (`c2-icerik-listesi.md`) ve 2 SQL dosyası (bkz. DATABASE.md).
- `Raporlar/`: oturum raporu (`.docx`).
- `branding/`: logo SVG'si.
