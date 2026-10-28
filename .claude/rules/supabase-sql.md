---
paths:
  - "supabase/**"
  - "src/types/database.ts"
---

# Supabase SQL kuralları

Kaynak: [docs/DATABASE.md](../../docs/DATABASE.md). Repoda migration takibi yok. Hangi SQL dosyalarının canlı veritabanına uygulandığı **doğrulanmadı**.

## Yasaklar
- Claude canlı Supabase veritabanına bağlanmaz. SQL, migration ya da `supabase` / `psql` komutu çalıştırmaz.
- `supabase/` altındaki mevcut `.sql` dosyaları **değiştirilmez ve silinmez**. Bu dosyalar geçmiş kayıttır.
- `Claude outputs/` altındaki SQL dosyaları uygulanmış kabul edilmez. Bu dosyalara dayanarak yeni SQL yazılmaz.

## Yeni SQL dosyası
- Konum: `supabase/`. Ad: `YYYYMMDD_konu.sql` (ör. `20261028_reviews_add_reply.sql`).
- Dosyanın başına yorum olarak şunlar yazılır: amaç, etkilenen tablolar, bağımlı olduğu önceki dosyalar ve geri alma (rollback) adımları.
- Yazım idempotent olur:
  - `create table if not exists`
  - `add column if not exists`
  - `create or replace function`
  - politikalarda önce `drop policy if exists`, sonra `create policy`
- Yeni tabloda `alter table ... enable row level security` ve gerekli politikalar **aynı dosyada** yer alır. RLS'i kapalı ya da politikasız bırakmanın gerekçesi yorumda belirtilir.
- Politikalarda terapist sahipliği `professionals.user_id = auth.uid()` üzerinden kurulur (`panel_auth_rls.sql` deseni).
- `public.set_updated_at()` birden fazla dosyada yeniden tanımlanmış. Yeni dosyada bu fonksiyon yeniden tanımlanmaz, mevcut olan kullanılır.
- Veri değiştiren script'lerde önce etkilenecek satırları gösteren bir önizleme `select`'i yazılır.

## Şema değişince
- `src/types/database.ts` aynı değişiklikte güncellenir. Dosya elle yazılmıştır.
- Kodda tablo veya kolon adı değişiyorsa `.from('...')` kullanımları Grep ile bulunur ve listelenir.

## Teslim
Dosya yazıldıktan sonra kullanıcıya şu bilgiler verilir:
- dosya yolu,
- "Supabase SQL Editor'da çalıştırın" talimatı,
- çalıştırma sonrası kontrol sorgusu.

Sonuç kullanıcıdan beklenir.
