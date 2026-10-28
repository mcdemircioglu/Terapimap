# Terapimap: Claude çalışma kuralları

Türkiye pazarına yönelik terapist (psikolog, psikiyatrist, psikolojik danışman vb.) keşif ve karşılaştırma platformu.
Modüller: public site, terapist paneli (`/panel`), admin (`/admin`), psikoloji rehberi (blog), psikoloji testleri, randevu, duyurular, profil doğrulama.

Ayrıntılar:
- Mimari: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Veritabanı: [docs/DATABASE.md](docs/DATABASE.md)
- Geliştirme: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)

## Stack
Next.js 14.2 (App Router), React 18, TypeScript (strict), Tailwind 3, Supabase (Postgres, Auth, Storage), next-intl 3, nodemailer (Gmail SMTP), Vercel Analytics.

## Komutlar
| Komut | Not |
|---|---|
| `npm run dev` | localhost:3000 |
| `npm run typecheck` | **Her değişiklikten sonra zorunlu.** Şu an temiz geçiyor. |
| `npm run build` | Route, ISR veya config değişikliklerinde çalıştırılır. |
| `npm run lint` | **Şu an çalışmıyor.** Repoda ESLint yapılandırması yok, komut etkileşimli kurulum sihirbazını açıp hata veriyor. Yapılandırma kullanıcı onayı olmadan eklenmez. |

Test altyapısı yok. Doğrulama typecheck, build ve elle kontrolle yapılır.

## Altın kurallar
1. **Supabase istemcisi** (`src/lib/supabase/server.ts`):
   - `getPublicClient()`: cookie'siz anon istemci. İki iş için kullanılır: anonim okumalar (ISR ve `unstable_cache` dahil) ve RLS'in anon kullanıcıya izin verdiği yazmalar (ör. `createLead`, `createTestSubmission`).
   - `getServerClient()`: cookie oturumlu istemci. Panel sayfaları ve route'larında kullanıcıyı tanımak için kullanılır. Kullanan sayfa dinamik olur.
   - `getServiceClient()`: service role. **RLS'i tamamen aşar**, bu yüzden özel dikkat gerektirir.
     - **Yalnızca sunucu tarafında** kullanılır (Route Handler, server kodu). Client component'e ya da tarayıcıya giden koda asla girmez.
     - Kullanmadan önce yetki kontrolü (admin parolası ya da panel oturumu ve sahiplik) kodda açıkça yapılmalıdır.
     - Admin, panel ve bazı public uçlarda kullanılıyor.
   - `getBrowserClient()` (`src/lib/supabase/client.ts`): yalnızca tarayıcı tarafında kullanılır.
2. **Public DB okumaları** mümkün olduğunca `src/lib/queries.ts` (ve `articles.ts`, `announcements.ts`, `seo-landing.ts`) üzerinden yapılır.
3. **Tek segmentli yeni bir public sayfa** (`/tr/<yeni>`) eklenirse `src/middleware.ts` içindeki `RESERVED_TOP_SEGMENTS` listesine eklenir. Eklenmezse `?page=` taşıyan istekler yanlışlıkla `[seoSlug]` dinamik varyantına rewrite edilir.
4. **Liste ve kart görünümünü etkileyen bir profesyonel güncellemesinden sonra** `revalidatePublicTherapistPages()` çağrılır. Yalnızca detay sayfasını etkileyen alanlar için `revalidateProfessionalPageOnly()` yeterlidir. Hangi alanların listeyi etkilediği `LIST_AFFECTING_FIELDS` içinde tanımlı (`src/lib/revalidatePublicPages.ts`).
5. **Dahili linkler** yardımcı fonksiyonlarla üretilir:
   - Profiller için `getProfessionalUrl()`, dizin için `getTherapistsListPath()` (`src/lib/utils.ts`).
   - `/therapists` ya da `/therapist/` yolları elle yazılmaz. Bunlar 301 redirect'e düşer.
6. **Dil:** aktif locale yalnızca `tr` (`src/i18n.ts`). EN içerik kaldırıldı ve `/en/*` adresleri `/tr/*`'ye 301 ile yönleniyor (`next.config.mjs`). Metinler `messages/tr.json` dosyasına yazılır. `messages/en.json` yüklenmiyor, kalıntı dosya. Koddaki EN kalıntıları teknik borç olarak [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) içinde listelenmiştir, ayrı bir görev olmadan temizlenmez.
7. **Server Component varsayılandır.** `"use client"` yalnızca etkileşimli parçalarda kullanılır.
8. **Admin API yetkilendirmesi** (`src/lib/admin/auth.ts`):
   - Giriş ucu `api/admin/auth`, istek gövdesindeki parolayı `verifyAdminPassword()` ile doğrular.
   - Diğer tüm `api/admin/**` handler'ları `x-admin-password` header'ını `verifyAdminRequest()` ile doğrular (dosya içi `verifyAuth()` yardımcısı üzerinden).
   - Yeni admin handler'ı da aynı deseni kullanır.
9. **Panel API'leri** (`src/app/api/panel/**`): her panel işleminde oturum (`getServerClient().auth.getUser()`) ve kayıt sahipliği (kaydın oturumdaki terapiste ait olduğu) doğrulanmalıdır. Bu bir geliştirme kuralıdır. Mevcut uçların tamamında uygulandığı doğrulanmadı.
10. **Public POST uçlarında** `src/lib/spamGuard.ts` kullanılır: honeypot alanı `hp_company` ve IP rate limit.
11. **`next.config.mjs` içindeki redirect listesi SEO açısından kritiktir.** Mevcut kayıtlar silinmez ya da değiştirilmez, yalnızca yeni kayıt eklenir.

## Veritabanı
- Canlı Supabase veritabanına Claude bağlanmaz, SQL ya da migration çalıştırmaz.
- `supabase/*.sql` altındaki mevcut dosyalar **değiştirilmez**. Her şema veya veri değişikliği yeni bir SQL dosyası olarak yazılır. Kullanıcı bu dosyayı Supabase SQL Editor'da kendisi çalıştırır.
- Şema değişince `src/types/database.ts` de güncellenir. Bu dosya elle yazılmış, otomatik üretilmiyor.
- Kurallar ve envanter için: [docs/DATABASE.md](docs/DATABASE.md).

## Güvenlik
- `.env.local` ve diğer `.env*` dosyaları okunmaz, içerikleri yazdırılmaz. Değişken adları için `.env.example` kullanılır.
- Anahtar, parola ve token değerleri koda, belgelere, commit mesajlarına ya da çıktılara yazılmaz.
- `scripts/import_professionals.py` service-role anahtarıyla canlı veriye yazar. Kullanıcı açıkça istemedikçe çalıştırılmaz.

## Git
- Commit, push, branch silme, rebase/amend ve deployment **yalnızca kullanıcının açık talebiyle** yapılır.
- Commit mesajları kısa ve Türkçe yazılır (mevcut geçmişteki gibi, ör. `fix: ...`).

## Ortam
- Geliştirme ortamı Windows ve PowerShell 5.1.
- PowerShell 5.1 UTF-8 Türkçe metni bozuk gösterir, `Set-Content` ise ANSI yazar. Dosyalar **Edit/Write araçlarıyla** düzenlenir, shell ile dosya yazılmaz.
- Kaynak kod yorumları Türkçe ve gerekçelidir. Yeni kod da aynı üslupla yazılır.
