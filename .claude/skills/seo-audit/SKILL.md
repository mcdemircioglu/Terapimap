---
name: seo-audit
description: Terapimap public sayfalarının SEO denetimi (metadata, canonical, robots, sitemap, redirect, iç link, JSON-LD, ISR). Salt okunur rapor üretir, hiçbir dosyayı değiştirmez ve bulguları düzeltmez.
argument-hint: "[tumu | degisiklik | route <yol> | sitemap | redirects]"
disable-model-invocation: true
disallowed-tools:
  - Edit
  - Write
  - NotebookEdit
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash(node .claude/skills/seo-audit/scripts/check-redirects.js)
  - PowerShell(node .claude/skills/seo-audit/scripts/check-redirects.js)
  - Bash(git diff *)
  - Bash(git status *)
---

# SEO denetimi (salt okunur)

Kapsam argümanı: `$ARGUMENTS` (boşsa `tumu`).

## Mutlak sınırlar
- **Hiçbir dosya oluşturulmaz, değiştirilmez ya da silinmez.** Düzenleme araçları bu skill için kapalıdır. Shell ile de dosya yazılmaz (`>`, `Set-Content`, `Out-File` vb. kullanılmaz).
- **Bulgular düzeltilmez.** Her bulgu için çözüm önerilir. Uygulama ancak kullanıcı ayrıca isterse, ayrı bir görev olarak yapılır.
- Veritabanına, Supabase'e, canlı siteye ya da ağa erişilmez. Veriye bağlı sonuçlar "Olası risk" olarak raporlanır.
- `npm run build` yalnızca kullanıcı açıkça onaylarsa çalıştırılır (kontrol H).
- `next.config.mjs` içindeki mevcut redirect kayıtlarının silinmesi ya da değiştirilmesi **önerilmez** (CLAUDE.md kural 11). Gerekirse yeni kayıt eklenmesi önerilir.

## Kaynaklar (kopyalanmaz, okunur)
- **Kurallar:** `.claude/rules/public-pages-seo.md`. Politika bu dosyadadır. Bu skill yalnızca kuralların nasıl denetleneceğini tanımlar, kural metnini tekrar etmez.
- **Mimari:** `docs/ARCHITECTURE.md` (rota haritası, ISR tablosu, SEO bölümü).
- **Kontrol kataloğu:** [references/checks.md](references/checks.md)
- **Rapor biçimi:** [references/report-template.md](references/report-template.md)

## Kapsam modları
| Argüman | Çalıştırılan kontroller |
|---|---|
| `tumu` | A–G (H yalnızca onayla) |
| `degisiklik` | `git status --short` ve `git diff --name-only` çıktısındaki public dosyalara uyan kontroller |
| `route <yol>` | Verilen rota (ör. `duyurular`, `therapists/[city]`), onun page-view'i ve o rotayı etkileyen A, B, C, F, G kontrolleri |
| `sitemap` | C2, D |
| `redirects` | E (script ile) |

Tanınmayan bir argüman gelirse kullanıcıya geçerli modlar gösterilir, tahminle kapsam seçilmez.

## Akış
1. Kapsamı belirle ve hangi kontrol kimliklerinin çalışacağını rapora yaz.
2. `.claude/rules/public-pages-seo.md` ve `references/checks.md` içinden yalnızca ilgili bölümleri oku.
3. Kanıtı Grep, Glob ve Read ile topla. Her kanıt için `dosya:satır` kaydet. Tahmin edilen satır numarası yazılmaz.
4. E kapsamdaysa script'i çalıştır ve çıktısını kanıt olarak kullan:
   `node .claude/skills/seo-audit/scripts/check-redirects.js`
5. Her bulguyu sınıflandır (aşağıda), önem derecesi ver ve çözüm öner.
6. Raporu `references/report-template.md` biçiminde sohbette sun. Rapor dosyaya yazılmaz.
7. Rapor sonunda denetlenmeyen kontrolleri ve nedenlerini listele.

## Sınıflandırma (zorunlu ayrım)
- **Doğrulanmış hata:** Kod ya da yapılandırma metni hatayı tek başına kanıtlar. Davranış yalnızca koddan çıkarılabilir, dış veriye ya da varsayıma dayanmaz.
- **Olası risk:** Sonuç çalışma zamanına, veritabanı verisine, Next.js'in belgelenmemiş davranışına ya da canlı ortama bağlıdır. Her olası risk için "doğrulamak için gereken" adım yazılır.
- **Bilgi:** Hata değil. Teknik borç ya da bakım notu.
- Emin olunamayan her şey **Olası risk** olarak raporlanır. Olası bir risk hiçbir zaman doğrulanmış hata gibi sunulmaz.

## Önem dereceleri
- **Kritik:** Sitenin genelinde indekslemeyi ya da erişimi bozar (ör. tüm profillerde yanlış canonical, yaygın 404).
- **Yüksek:** Bir sayfa türünü ya da önemli bir trafik yolunu etkiler.
- **Orta:** Sınırlı sayıda sayfayı etkiler ya da tarama bütçesini boşa harcar.
- **Düşük:** Küçük tutarsızlık, kozmetik ya da tek bir sayfayla sınırlı.
