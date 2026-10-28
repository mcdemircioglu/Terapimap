---
paths:
  - "src/app/api/**"
  - "src/lib/admin/**"
  - "src/lib/panel/**"
  - "src/lib/supabase/**"
  - "src/lib/spamGuard.ts"
---

# API route kuralları

Kaynak: [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md), API ve kimlik doğrulama bölümleri.

## Admin uçları (`src/app/api/admin/**`)
- Giriş ucu `api/admin/auth`, istek gövdesindeki parolayı `verifyAdminPassword()` ile doğrular.
- Diğer tüm admin handler'ları mevcut deseni izler:
  - dosya içinde `function verifyAuth(request) { return verifyAdminRequest(request); }` tanımlanır,
  - her `GET/POST/PUT/PATCH/DELETE` handler'ının **başında** çağrılır,
  - başarısızsa 401 dönülür.
- Yeni admin handler'ı bu deseni birebir izler. Hiçbir handler yetki kontrolü olmadan service client kullanmaz.

## Panel uçları (`src/app/api/panel/**`)
- Her panel işleminde **oturum** ve **kayıt sahipliği** doğrulanmalıdır:
  1. `getServerClient().auth.getUser()` çağrılır. Kullanıcı yoksa 401 dönülür.
  2. Kullanıcının terapist kaydı `professionals.user_id = user.id` ile bulunur.
  3. İşlem yapılan kaydın bu terapiste ait olduğu kontrol edilir (ör. `professional_id` eşleşmesi). Eşleşmiyorsa 403 ya da 404 dönülür.
- Mevcut panel uçlarının tamamında bu kontrolün yapıldığı **doğrulanmadı**. Mevcut bir panel ucuna dokunulurken kontrol eksikse kullanıcıya bildirilir.

## Supabase istemcileri
- `getPublicClient()`: anonim okumalar ve RLS'in anon kullanıcıya izin verdiği yazmalar için kullanılır.
- `getServerClient()`: oturumlu kullanıcı için kullanılır, RLS geçerlidir.
- `getServiceClient()`: **RLS'i tamamen aşar.**
  - Yalnızca sunucu tarafında, yetki kontrolünden **sonra** kullanılır.
  - Sorgu kapsamı kodda açıkça daraltılır (ör. `.eq('id', ...)`, sahiplik filtresi).
  - Client component'e ya da `"use client"` dosyasından import edilen bir modüle asla girmez.

## Public uçlar
- Public POST uçlarında `src/lib/spamGuard.ts` kullanılır:
  - `isHoneypotTripped` (`hp_company` alanı) dolu gelirse sessizce `fakeOk` dönülür.
  - `isRateLimited` aşılırsa `tooManyRequests` dönülür.
  - `JSON_LIMIT` / `UPLOAD_LIMIT` boyut sınırları uygulanır.
- Bu korumanın tüm mevcut public uçlarda bulunduğu **doğrulanmadı**.
- Girdi doğrulaması (tip, uzunluk, izinli değerler) veritabanına yazmadan önce yapılır.

## Genel
- Hata yanıtları gizli bilgi, stack trace ya da ortam değişkeni değeri içermez.
- Yükleme uçları dosya tipi ve boyutunu kontrol eder. Kullanılan bucket'lar: `therapists`, `therapist-photos`, `therapist-documents`.
- Profesyonel verisini değiştiren uçlar ilgili `revalidate*` fonksiyonunu çağırır (bkz. `public-pages-seo.md`).
