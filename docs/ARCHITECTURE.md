# Mimari

> Bu belgedeki bilgiler kaynak koddan doğrulandı (2026-10-28). Doğrulanamayan bilgiler **"Doğrulanmadı:"** etiketiyle işaretlidir.

## Dizin haritası

```
src/
  app/
    [locale]/          Public site (locale önekli; aktif locale yalnızca "tr")
    admin/             Admin arayüzü (parola korumalı, locale dışı)
    panel/             Terapist paneli (Supabase Auth, locale dışı)
    profil-dogrula/    Profil doğrulama talebi akışı
    iletisime-gectim/  Lead "iletişime geçtim" onay sayfası
    api/               Route Handler'lar (admin/, panel/, public)
    robots.ts, sitemap.xml/route.ts
  components/          UI: ui/ (temel bileşenler), home/, panel/, admin/, seo/, therapist/,
                       guide/, tests/, announcements/, cookie-consent/
  lib/
    supabase/          server.ts (public/server/service istemcileri), client.ts (tarayıcı)
    queries.ts         Public DB okumaları ve yazmaları (lead, test sonucu, yorum)
    page-views/        Statik ve dyn rotaların paylaştığı sayfa görünümleri
    admin/             auth.ts (parola doğrulama), sessionCache.ts (tarayıcı önbelleği)
    panel/             session.ts, features.ts (modül bayrakları), profileCompleteness.ts
    appointments/      slots.ts, time.ts (İstanbul saat dilimi hesapları)
    email.ts           Tüm e-posta şablonları ve gönderim
    spamGuard.ts       Honeypot ve IP rate limit
    revalidatePublicPages.ts, seo-landing.ts, seo-slugs.ts, schema.ts (JSON-LD),
    articles.ts, announcements.ts, cities.ts, districts.ts, maps.ts, utils.ts
  types/database.ts    Elle yazılmış DB tipleri
  i18n.ts, middleware.ts
messages/              tr.json (aktif), en.json (kullanılmıyor)
supabase/              SQL dosyaları (bkz. DATABASE.md)
scripts/               import_professionals.py (CSV'den Supabase'e içe aktarma)
public/                Statik görseller (rehber kapakları, ikonlar, OG görseli)
```

## Route haritası

### Public site: `src/app/[locale]/`
| Yol | Amaç |
|---|---|
| `/` | Ana sayfa |
| `/therapists`, `/therapists/[city]`, `/therapists/[city]/[specialty]` | Terapist dizini. Public URL `/tr/terapistler/...`, `next.config.mjs` içindeki rewrite ile bu rotaya bağlanır. `/tr/therapists` adresi 301 ile `/tr/terapistler`'e yönlenir. |
| `/psikolog/[slug]`, `/psikiyatrist/[slug]`, `/psikolojik-danisman/[slug]`, `/aile-terapisti/[slug]`, `/cocuk-psikiyatristi/[slug]` | Tip bazlı profil sayfaları. Eşleşme `professional_type`'tan URL segmentine gider (`src/lib/utils.ts` içinde `PROF_TYPE_URL`). |
| `/therapist/[slug]` | Eski profil rotası. `next.config.mjs` bunu 301 ile `/psikolog/[slug]` adresine yönlendirir. |
| `/[seoSlug]` | SEO landing sayfaları (`src/lib/seo-slugs.ts`, `src/lib/seo-landing.ts`, `seo_landing_pages` tablosu) |
| `/psikoloji-rehberi`, `/psikoloji-rehberi/[slug]`, `/psikoloji-rehberi/kategori/[kategori]` | Blog ve rehber makaleleri |
| `/testler`, `/testler/[testSlug]` | Psikoloji testleri |
| `/duyurular` | Terapist duyuruları (etkinlik, eğitim, iş ilanı) |
| `/one-cikan-terapistler` | Öne çıkan terapistler |
| `/uzman-basvuru` | Terapist başvuru formu |
| `/about`, `/iletisim` | Hakkında ve iletişim sayfaları |
| `/gizlilik-politikasi`, `/kullanim-kosullari`, `/kvkk-aydinlatma-metni`, `/cerez-politikasi`, `/terapist-profil-politikasi` | Yasal sayfalar |
| `/dyn/...` | Yalnızca iç rewrite hedefi. Dışarıdan erişilirse 404 döner (aşağıya bakın). |

### Locale dışı sayfalar
| Yol | Amaç |
|---|---|
| `/admin`, `/admin/{announcements,articles,basvurular,davetler,leads,reviews,verification-requests}` | Admin arayüzü |
| `/panel/giris`, `/panel/sifre-belirle`, `/panel/auth/callback` | Panel girişi ve davet/şifre akışı (Supabase PKCE) |
| `/panel/(app)/…` | Panel modülleri: genel bakış, `talepler`, `profil`, `blog`, `randevular` (+`musaitlik`), `duyurular`, `ayarlar`. Modül bayrakları `src/lib/panel/features.ts` içinde (`analytics` kapalı). |
| `/profil-dogrula/[professionalId]` | Profil doğrulama talebi |
| `/iletisime-gectim/[leadId]` | Terapistin lead ile iletişime geçtiğini onayladığı sayfa |

### API: `src/app/api/`
| Grup | Uçlar | Koruma |
|---|---|---|
| `api/admin/auth` | Admin girişi | `verifyAdminPassword()`: parola istek gövdesinden okunur, IP kilitleme uygulanır |
| `api/admin/*` (diğer 19 route dosyası) | announcements, articles, leads (+send), professionals (+panel-invite), reviews, specialties, upload, verification-invites, verification-requests, revalidate-all, revalidate-specialties | Her handler dosya içi `verifyAuth()` üzerinden `verifyAdminRequest()` çağırır (`x-admin-password` header'ı) |
| `api/panel/*` | announcements (+registrations), appointments accept/cancel, articles, availability (+exceptions), leads mark-contacted, profile-update, upload-photo/document/article-cover/announcement-image, remove-document | Tüm dosyalar `getServerClient` import ediyor, 12'si ayrıca `getServiceClient` kullanıyor. Doğrulanmadı: her handler'da oturum ve kayıt sahipliği kontrolünün yapıldığı. Kural için CLAUDE.md 9. madde. |
| Public | `leads`, `appointments` (+available-slots), `reviews`, `testler/submit`, `verification-requests` (+upload, upload-document), `announcements/[id]/register`, `iletisime-gectim/[leadId]` | `spamGuard` (honeypot, rate limit). Doğrulanmadı: her uçta bulunup bulunmadığı tek tek kontrol edilmedi. |

## ISR ve dinamik varyant deseni (`src/middleware.ts`)
- Liste ve landing sayfaları `searchParams` okumaz. Bu sayede ISR ile önbelleğe alınabilirler.
- İstek `DYN_QUERY_KEYS` içindeki bir query'yi taşıyorsa (`page`, `online`, `inPerson`, `type`, `district`, `q`, `specialty`, `city`), middleware isteği içeride `/{locale}/dyn/...` rotasına rewrite eder. URL kullanıcı tarafında aynı kalır.
  - `terapistler` ve `therapists` için hedef `/{locale}/dyn/therapists[/city[/specialty]]` olur.
  - Tek segmentli yol ve `?page=` için hedef `/{locale}/dyn/s/{seoSlug}` olur. Yol `RESERVED_TOP_SEGMENTS` listesindeyse rewrite **yapılmaz**.
- `dyn` rotaları `force-dynamic` çalışır ve aynı view'i (`src/lib/page-views/*`) `searchParams` ile render eder.
- `utm_*`, `gclid` gibi takip parametreleri listede yok. Bu istekler statik sayfaya düşer.
- Dışarıdan `/{locale}/dyn/...` isteği gelirse 404 döner.
- Middleware matcher `api`, `admin`, `profil-dogrula`, `iletisime-gectim`, `_next` ve uzantılı dosyaları atlar.
- `/panel` yolunda next-intl çalışmaz. Middleware burada yalnızca Supabase oturum cookie'sini tazeler.

**Önbellek süreleri (kodda bulunan `export const revalidate` değerleri):**

| Süre | Dosyalar |
|---|---|
| `604800` (7 gün) | Profil sayfaları: `psikolog/`, `psikiyatrist/`, `psikolojik-danisman/`, `aile-terapisti/`, `cocuk-psikiyatristi/` altındaki `[slug]/page.tsx` (5). Liste sayfaları: `therapists/page.tsx`, `therapists/[city]/page.tsx`, `therapists/[city]/[specialty]/page.tsx` (3). SEO landing: `[seoSlug]/page.tsx` (1). |
| `3600` (1 saat) | Sayfalar: `[locale]/page.tsx` (ana sayfa), `one-cikan-terapistler`, `duyurular`, `psikoloji-rehberi` (liste, `[slug]`, `kategori/[kategori]`), `testler` (liste, `[testSlug]`) (8). Sayfa olmayanlar: `sitemap.xml/route.ts` ve kullanılmayan `sitemap.old.ts` (2). |
| `force-dynamic` | `dyn/therapists/**` (3) ve `dyn/s/[seoSlug]` (1) |

- `src/lib/queries.ts` içindeki `unstable_cache` çağrıları `revalidate: 86400` ve `tags: ['therapists-list']` kullanıyor (4 çağrı). Bu süre veri önbelleğine aittir. Liste sayfalarının sayfa düzeyindeki ISR süresi 604800'dür.
- OG görselleri (`opengraph-image.tsx`) Supabase'den yaptıkları fetch'lerde `next: { revalidate: 86400 }` kullanıyor.
- Anında tazeleme için `src/lib/revalidatePublicPages.ts` kullanılır:
  - `revalidatePublicTherapistPages()`: `therapists-list` etiketini, ana sayfayı, öne çıkanlar sayfasını, dizini ve verilen profili tazeler.
  - `revalidateProfessionalPageOnly()`: yalnızca profil sayfasını tazeler.
  - `LIST_AFFECTING_FIELDS`: liste önbelleğini etkileyen alanlar.

## Supabase istemcileri (`src/lib/supabase/`)
| Fonksiyon | Anahtar | Cookie | Kullanım |
|---|---|---|---|
| `getPublicClient()` | anon | yok | Anonim okumalar (ISR-safe, `unstable_cache` içinde kullanılabilir) ve RLS'in anon kullanıcıya izin verdiği yazmalar (ör. `queries.ts` içindeki `createLead`, `createTestSubmission`, ayrıca `api/leads`). Singleton. |
| `getServerClient()` | anon | var | Oturumlu kullanıcı (panel), RLS geçerli |
| `getServiceClient()` | service role | yok | **RLS'i tamamen aşar.** Yalnızca sunucu tarafında kullanılır. Yetki kontrolü çağıran kodda açıkça yapılmalıdır. Admin uçlarında, 12 panel API dosyasında ve bazı public akışlarda kullanılıyor (ör. `queries.ts` içindeki `createReview`). Singleton. Anahtar eksikse hata fırlatır. |
| `getBrowserClient()` | anon | tarayıcı | Client component'ler |

## Kimlik doğrulama
- **Admin:** tek paylaşılan parola (`ADMIN_PASSWORD`).
  - Giriş ucu (`api/admin/auth`) parolayı istek gövdesinden alır ve `verifyAdminPassword()` ile doğrular. `ADMIN_PASSWORD` tanımlı değilse açıklayıcı bir hata döner.
  - Diğer admin uçları parolayı her istekte `x-admin-password` header'ından alır ve `verifyAdminRequest()` ile doğrular.
  - SHA-256 ve `timingSafeEqual` ile karşılaştırılır.
  - Aynı IP'den 15 dakika içinde 8 hatalı denemeden sonra kilitlenir. Sayaç bellek içi tutulur, instance başına çalışır.
  - Kaynak: `src/lib/admin/auth.ts`.
- **Panel:** Supabase Auth.
  - Davet bağlantısı `/panel/auth/callback` adresine döner (PKCE kod değişimi) ve kullanıcı `/panel/sifre-belirle` sayfasına yönlenir.
  - Terapist kaydı `professionals.user_id = auth.uid()` ile eşleşir (`src/lib/panel/session.ts`, `getPanelProfessional`).
  - Supabase Dashboard'daki Redirect URLs listesinde `{SITE_URL}/panel/auth/callback` adresinin bulunması gerekir (kaynak: callback dosyasının yorumu).

## E-posta (`src/lib/email.ts`)
- Gmail SMTP (`smtp.gmail.com:465`), havuzlu transport. Gerekli değişkenler: `GMAIL_USER` ve `GMAIL_APP_PASSWORD`.
- Dışa açılan fonksiyonlar:
  - Lead: `sendLeadToTherapist`, `sendLeadNotification`, `sendConfirmationToClient`
  - Başvuru ve davet: `sendApplicationNotification`, `sendVerificationInvite`, `sendPanelInviteEmail`
  - Test: `sendTestResultEmail`
  - Randevu: `sendAppointmentRequestToTherapist`, `sendAppointmentPendingToClient`, `sendAppointmentConfirmedToClient`, `sendAppointmentCancelledToClient`
  - Duyuru: `sendAnnouncementSubmissionNotification`

## Storage bucket'ları
Kodda kullanılan bucket'lar:
- `therapists`: profil fotoğrafı, makale kapağı, duyuru görseli, admin yüklemeleri.
- `therapist-photos`: doğrulama talebi fotoğrafları.
- `therapist-documents`: diploma ve sertifika belgeleri.

Yalnızca `therapist-documents` bucket'ının oluşturulması SQL'de var (`supabase/documents_migration.sql`). Doğrulanmadı: diğer iki bucket'ın Dashboard'dan oluşturulduğu varsayılıyor.

## SEO
- JSON-LD üreticileri: `src/lib/schema.ts`.
- Sitemap: `src/app/sitemap.xml/route.ts`. Robots: `src/app/robots.ts`.
- OG görselleri: `opengraph-image.tsx` (profil ve rehber).
- `next.config.mjs` (~290 satır) içinde yaklaşık 240 adet `permanent: true` redirect var:
  - bozuk ve keyword-stuffed slug'lardan temiz slug'lara
  - `/therapist` adresinden `/psikolog` adresine
  - `/en/*` adreslerinden `/tr/*` adreslerine
- Yine `next.config.mjs` içinde `/terapistler` → `/therapists` rewrite'ı ve `images.remotePatterns` tanımlı.

## Bilinen teknik borç
- `getServiceClient()` dönüş tipi `any` (35'ten fazla çağıran var, kaynak: dosya yorumu).
- `src/types/database.ts` elle yazılmış. Gerçek şemadan sapmış olabilir.
- Test altyapısı yok. ESLint yapılandırması yok, `npm run lint` çalışmıyor.
- `src/app/sitemap.old.ts`: eski sitemap, yerini `sitemap.xml/route.ts` almış. Hiçbir yerden import edilmiyor.
- `src/kapak`: `src/` içinde uzantısız, yaklaşık 1.5 MB'lık bir görsel dosyası (PNG ve SVG verisi içeriyor).
- **EN kalıntıları** (aktif locale yalnızca `tr`; şimdilik dokunulmuyor):
  - `messages/en.json`: yüklenmiyor.
  - `src/components/home/HeroSearch.tsx:151`: `locale === 'en'` dalı.
  - `src/lib/utils.ts`: `formatExperience(years, locale: 'tr' | 'en')` ve `getTherapistsListPath` içindeki `en` dalı.
  - `src/app/[locale]/therapist/[slug]` ve `therapists` gibi İngilizce route adları. Bunlar public URL'lerde rewrite ya da redirect ile gizleniyor ve hâlâ kullanımda.
- **Kod yorumlarında tutarsızlık:**
  - `src/lib/revalidatePublicPages.ts:20`: yorum, liste sayfalarının `revalidate = 86400` kullandığını söylüyor. Gerçekte sayfa ISR süresi 604800, 86400 ise `unstable_cache` süresi.
  - `src/middleware.ts:25-27`: "buraya EKLEME" ifadesi yanlış anlaşılmaya açık. Kodun davranışına göre, tek segmentli yeni public sayfalar `RESERVED_TOP_SEGMENTS` listesine eklenmelidir.
- Admin ve spam rate limitleri bellek içi tutuluyor, serverless instance'lar arasında paylaşılmıyor. `spamGuard.ts` yorumu asıl katmanın Vercel Firewall olduğunu belirtiyor. Doğrulanmadı: Firewall kuralları.
