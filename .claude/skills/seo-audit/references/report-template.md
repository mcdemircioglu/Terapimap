# Rapor biçimi

Rapor sohbette verilir, dosyaya yazılmaz. Bölümler bu sırayla gelir. Boş bir bölüm "Yok" diye yazılır, atlanmaz.

```markdown
## SEO denetimi: <kapsam>

**Özet:** <1–2 cümle: kaç doğrulanmış hata, kaç olası risk, en önemli konu>
**Çalıştırılan kontroller:** <kimlik listesi, ör. A1, A3, B1, C1>
**Kod değişikliği:** Yapılmadı (salt okunur denetim).

### Doğrulanmış hatalar
| # | Önem | Kontrol | Dosya:satır | Sorun | Önerilen çözüm |
|---|---|---|---|---|---|
| 1 | Yüksek | A1 | `src/middleware.ts:28` | ... | ... |

### Olası riskler
| # | Önem | Kontrol | Dosya:satır | Risk | Doğrulamak için | Önerilen çözüm |
|---|---|---|---|---|---|---|

### Bilgi notları
- `dosya:satır`: ...

### Denetlenmeyenler
- <kontrol>: <neden, ör. veritabanı erişimi yok, build onayı verilmedi>
```

## Kurallar
- Her bulguda dosya, satır, önem ve önerilen çözüm **zorunludur**. Satır numarası Read ya da Grep çıktısından alınır, tahmin edilmez.
- Doğrulanmış hatalar ve olası riskler **ayrı tablolarda** verilir, karıştırılmaz.
- Kanıt gerekiyorsa tablonun altında kısa bir kod alıntısı verilir (en fazla birkaç satır).
- Çözüm önerisi kodu değiştirmez, yalnızca ne yapılacağını anlatır. Redirect'ler için mevcut kaydı silmek ya da değiştirmek önerilmez.
- Rapor sonunda kullanıcıya şu hatırlatma yapılır: düzeltmeler ayrı bir görev olarak istenebilir.
