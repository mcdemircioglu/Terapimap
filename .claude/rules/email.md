---
paths:
  - "src/lib/email.ts"
---

# E-posta kuralları

Kaynak: [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md), e-posta bölümü.

- Gönderim, `src/lib/email.ts` içindeki havuzlu tek Gmail SMTP transport'u (`getTransport()`) üzerinden yapılır. Yeni transport ya da başka bir e-posta kütüphanesi eklenmez.
- `GMAIL_USER` ve `GMAIL_APP_PASSWORD` yalnızca `process.env` üzerinden okunur. Değerleri koda, log'a, hata mesajına ya da e-posta içeriğine yazılmaz.
- Yeni e-posta mevcut deseni izler:
  - dışa açılan `XxxInput` tipi,
  - `async function sendXxx(input)`,
  - gönderen adı `Terapimap`,
  - linkler `BASE` (`NEXT_PUBLIC_SITE_URL`) ile mutlak üretilir.
- Kullanıcıdan gelen tüm değerler (ad, mesaj, telefon vb.) HTML şablonuna eklenmeden önce kaçışlanır. Mevcut şablonlardaki kaçış yardımcısı kullanılır.
- Kampanya metinleri `CAMPAIGN_FEATURED_UNTIL` mantığına bağlıdır. Bu mantık `api/admin/verification-requests/[id]` ile senkron tutulur.
- Claude gerçek alıcıya test e-postası **göndermez** ve gönderen bir uç ya da script çalıştırmaz. Şablon görünümü gerekiyorsa statik bir HTML önizleme dosyası hazırlanır (önceki örnekler `Claude outputs/*-preview.html`).
- Mevcut bir şablonun metni değişiyorsa değişiklik kullanıcıya önce/sonra şeklinde gösterilir. Bu e-postalar canlı akışlarda (lead, randevu, davet) kullanılıyor.
