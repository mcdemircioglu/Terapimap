---
paths:
  - 'src/app/\[locale\]/**'
  - "src/middleware.ts"
  - "next.config.mjs"
  - "src/lib/page-views/**"
  - "src/lib/queries.ts"
  - "src/lib/revalidatePublicPages.ts"
  - "src/lib/seo-*.ts"
  - "src/lib/schema.ts"
  - "src/lib/utils.ts"
  - "src/app/sitemap.xml/**"
  - "src/app/robots.ts"
---

# Public sayfalar, ISR ve SEO kuralları

Kaynak: [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md), route haritası ve ISR bölümleri.

## ISR ve dinamik varyant
- Statik ve ISR liste/landing sayfaları `searchParams` **okumaz**. Filtreli ya da sayfalı istekler `src/middleware.ts` tarafından `/{locale}/dyn/...` rotasına rewrite edilir. Bu rotalar `force-dynamic` çalışır ve aynı view'i `src/lib/page-views/*` üzerinden render eder.
- Yeni bir filtre query parametresi eklenirse `DYN_QUERY_KEYS` güncellenir. Statik sayfa ile `dyn` sayfası aynı view'i kullanmaya devam eder.
- **Tek segmentli yeni bir public sayfa** (`src/app/[locale]/<yeni>/page.tsx`) eklenirse `RESERVED_TOP_SEGMENTS` listesine eklenir. Eklenmezse `?page=` taşıyan istekler `[seoSlug]` varyantına yanlış rewrite edilir. Middleware'deki "buraya EKLEME" yorumu yanıltıcıdır, geçerli olan bu kuraldır.
- `/{locale}/dyn/...` rotasına dışarıdan link verilmez.
- `getServerClient()` (cookie) ISR sayfalarında kullanılmaz, kullanılırsa sayfa dinamikleşir. Public veri için `getPublicClient()` kullanılır.

## Önbellek süreleri (mevcut değerler)
| Değer | Kullanıldığı yer |
|---|---|
| `revalidate = 604800` | Profil sayfaları, `therapists` liste sayfaları, `[seoSlug]` |
| `revalidate = 3600` | Ana sayfa, öne çıkanlar, duyurular, rehber, testler, sitemap |
| `unstable_cache` 86400 + `tags: ['therapists-list']` | `src/lib/queries.ts` |

Bu değerleri değiştirmeden önce kullanıcıya sorulur.

## Revalidate
- Profesyonel verisi değişince:
  - `LIST_AFFECTING_FIELDS` içindeki bir alan değiştiyse `revalidatePublicTherapistPages(professional)` çağrılır,
  - değilse `revalidateProfessionalPageOnly(professional)` yeterlidir.
- Makale, duyuru, test ya da SEO landing gibi diğer içerikler değiştiğinde ilgili sayfa yolları da tazelenir. Mevcut admin uçlarındaki deseni izleyin.

## URL ve linkler
- Profil linkleri `getProfessionalUrl(slug, professional_type, locale)` ile üretilir. Dizin linkleri `getTherapistsListPath(locale)` ile üretilir (`src/lib/utils.ts`).
- `/therapists` ve `/therapist/` elle yazılmaz. Public dizin URL'i `/tr/terapistler` adresidir (`next.config.mjs` içinde rewrite).
- URL'lerdeki filtre değerleri Türkçe karakter içermeyen slug'lardır (`slugifyTr`).

## `next.config.mjs` redirect'leri
- Mevcut redirect kayıtları **silinmez ve değiştirilmez**. Bunlar indekslenmiş eski URL'leri korur.
- Yeni redirect, ilgili blokta yorumuyla birlikte eklenir ve `permanent: true` kullanılır. Redirect zinciri ve döngü oluşturulmaz.

## SEO kontrol listesi (yeni veya değişen public sayfa)
- `generateMetadata`: başlık, açıklama ve canonical tanımlı olmalı. Kalıntı EN alternate'i eklenmez.
- JSON-LD `src/lib/schema.ts` üreticileriyle eklenir.
- Sayfa sitemap'te olmalıysa `src/app/sitemap.xml/route.ts` güncellenir.
- Az içerikli landing sayfaları için `MIN_THERAPISTS_FOR_INDEX` mantığına uyulur.
- Değişiklikten sonra `npm run build` çalıştırılır. Build çıktısında sayfanın statik/ISR ya da dinamik olduğu kontrol edilir.
