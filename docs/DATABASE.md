# Veritabanı

> ⚠️ **Bu belge repodaki SQL dosyalarından ve kaynak koddan derlenmiştir. Canlı veritabanıyla karşılaştırılmamıştır.
> Hangi SQL dosyalarının canlı Supabase projesine uygulandığı doğrulanmadı.** Repoda migration takip sistemi
> (Supabase CLI, `migrations/` klasörü, uygulanma kaydı) yoktur. Dosyalar Supabase SQL Editor'da elle çalıştırılmıştır.

## Tablolar

| Tablo | Amaç | Oluşturan dosya | Kodda kullanım (`.from()` sayısı) |
|---|---|---|---|
| `professionals` | Terapist profilleri (ana tablo) | `schema.sql` | 62 |
| `specialties` | Uzmanlık taksonomisi | `schema.sql` | 8 |
| `professional_specialties` | Profesyonel ile uzmanlık arasındaki çoka-çok ilişki | `schema.sql` | 9 |
| `leads` | Danışan iletişim talepleri | `schema.sql` | 13 |
| `seo_landing_pages` | SEO landing sayfalarının içerikleri | `seo_landing_migration.sql` | 1 |
| `therapist_verification_requests` | Profil doğrulama, güncelleme ve yeni başvuru talepleri | `verification_requests_migration.sql` | 14 |
| `articles` | Psikoloji rehberi ve terapist blog yazıları | `articles_migration.sql` | 17 |
| `psychology_tests` | Test tanımları | `psychology_tests_migration.sql` | 3 |
| `test_submissions` | Test sonuç gönderimleri | `psychology_tests_migration.sql` | 1 |
| `availability_rules` | Terapistin haftalık müsaitliği | `appointments_migration.sql` | 6 |
| `availability_exceptions` | Müsaitlik istisnaları | `appointments_migration.sql` | 5 |
| `appointments` | Randevular | `appointments_migration.sql` | 9 |
| `reviews` | Danışan değerlendirmeleri | `reviews_migration.sql` | 8 |
| `announcements` | Terapist duyuruları | `announcements_migration.sql` | 16 |
| `announcement_registrations` | Duyuru kayıtları | `announcements_migration.sql` | 2 |
| `professionals_name_backup` | Unvan normalizasyonu öncesi isim yedeği | `titles_apply.sql` | 0 |

Sütun düzeyindeki tipler için `src/types/database.ts` dosyasına bakın. Bu dosya elle yazılmıştır ve doğrulanmadı: şemayla tam uyumlu olup olmadığı kontrol edilmedi.

## Fonksiyonlar ve RPC
- `public.set_updated_at()`: `updated_at` trigger fonksiyonu. İlk tanımı `schema.sql` içinde. `seo_landing_migration.sql`, `reviews_migration.sql` ve `verification_requests_migration.sql` dosyalarında `create or replace` ile yeniden tanımlanıyor.
- `public.reading_minutes(articles)`: makale okuma süresini hesaplar (`articles_migration.sql`).
- `public.admin_update_professional(...)`: terapist güncellemesini tek transaction'da yapar (`admin_update_professional_rpc.sql`). Kodda `.rpc('admin_update_professional')` ile çağrılıyor.

## RLS politikaları (SQL dosyalarına göre)
| Tablo | Politika | Dosya |
|---|---|---|
| `professionals`, `specialties`, `professional_specialties` | Herkese okuma | `schema.sql`, `migration.sql` |
| `leads` | Herkes ekleyebilir | `schema.sql`, `migration.sql` |
| `professionals` | Terapist kendi satırını okur ve günceller | `panel_auth_rls.sql` |
| `leads` | Terapist kendisine gönderilen lead'leri okur ve "iletişime geçildi" olarak işaretler | `panel_auth_rls.sql`, `panel_leads_rls.sql` |
| `therapist_verification_requests` | Herkes ekleyebilir. Terapist kendi taleplerini okur. | `verification_requests_migration.sql`, `panel_verification_requests_rls.sql` |
| `articles` | Yayımlananlar herkese açık | `articles_migration.sql` |
| `psychology_tests`, `test_submissions` | Yayımlanan testler herkese açık, sonuçları herkes gönderebilir | `psychology_tests_migration.sql` |
| `availability_rules`, `availability_exceptions` | Terapist kendi kayıtlarını yönetir | `appointments_migration.sql` |
| `appointments` | Terapist kendi randevularını okur ve iptal eder | `appointments_migration.sql` |
| `reviews` | Herkes ekleyebilir, onaylananlar herkese açık | `reviews_migration.sql` |
| `seo_landing_pages` | Herkese okuma | `seo_landing_migration.sql` |
| `announcements` | Yayımlananlar herkese açık | `announcements_migration.sql` |
| `announcement_registrations` | RLS açık, `create policy` yok. Erişim yalnızca service role ile yapılıyor (çıkarım). | `announcements_migration.sql` |
| `storage.objects` (`therapist-documents`) | Public okuma, service yükleme ve silme | `documents_migration.sql` |

`panel_security_audit_fixes.sql` dosyası güvenlik denetiminde bulunan RLS düzeltmelerini içeriyor. Ayrıntı için dosyanın kendisine bakın.

## SQL dosya envanteri (46 dosya, `supabase/`)
Tarihler, dosyaların yerel değiştirilme tarihidir (uygulanma tarihi değil).

### Şema ve migration (25)
| Dosya | Tarih | Konu |
|---|---|---|
| `schema.sql` | 2026-05-06 | İlk şema: specialties, professionals, professional_specialties, leads, RLS |
| `migration.sql` | 2026-05-14 | İdempotent şema güncellemesi (specialties `name_tr`/`name_en` vb.) |
| `add_status_verified.sql` | 2026-06-04 | professionals tablosuna `status` ve `is_verified` |
| `add_contact_fields.sql` | 2026-06-18 | professionals tablosuna iletişim ve konum alanları |
| `verification_requests_migration.sql` | 2026-06-19 | therapist_verification_requests tablosu |
| `add_leads_sent_at.sql` | 2026-07-06 | leads tablosuna `sent_at` |
| `seo_landing_migration.sql` | 2026-07-08 | seo_landing_pages tablosu |
| `articles_migration.sql` | 2026-07-17 | articles tablosu |
| `articles_covers.sql` | 2026-07-21 | Makale kapak görselleri |
| `specialties_taxonomy_migration.sql` | 2026-07-21 | Uzmanlık `type` kolonu ve 63 kalemlik taksonomi |
| `therapist_applications_migration.sql` | 2026-07-28 | `request_type` alanına `'new'` (terapist başvurusu) |
| `featured_until.sql` | 2026-08-28 | Öne çıkarma bitiş zamanı |
| `articles_related_specialty.sql` | 2026-09-01 | Makale ile uzmanlık ilişkisi |
| `psychology_tests_migration.sql` | 2026-09-23 | psychology_tests ve test_submissions |
| `psychology_tests_add_cover_image.sql` | 2026-09-23 | Test kapak görseli kolonu |
| `documents_migration.sql` | 2026-09-30 | Belge yükleme ve `therapist-documents` bucket'ı |
| `articles_therapist_blog.sql` | 2026-10-01 | Terapist blog alanı |
| `appointments_migration.sql` | 2026-10-02 | Randevu sistemi tabloları |
| `appointments_pending_status.sql` | 2026-10-02 | Randevu `pending` durumu |
| `booking_tier_migration.sql` | 2026-10-02 | `booking_tier` (geçici paket seviyesi) |
| `reviews_migration.sql` | 2026-10-05 | reviews tablosu |
| `announcements_migration.sql` | 2026-10-06 | announcements ve announcement_registrations |
| `featured_source.sql` | 2026-10-07 | Öne çıkarma kaynağı ve lansman kampanyası |
| `admin_update_professional_rpc.sql` | 2026-10-09 | `admin_update_professional` RPC |
| `fix_professional_type_check.sql` | 2026-10-13 | `professional_type` CHECK constraint düzeltmesi |

### RLS (4)
| Dosya | Tarih | Konu |
|---|---|---|
| `panel_auth_rls.sql` | 2026-09-07 | Panel auth ve RLS temeli |
| `panel_verification_requests_rls.sql` | 2026-09-08 | Panelden gönderilen talepler |
| `panel_leads_rls.sql` | 2026-09-08 | Panel talepler modülü |
| `panel_security_audit_fixes.sql` | 2026-09-08 | Güvenlik denetimi düzeltmeleri |

### Seed ve veri güncellemesi (11)
| Dosya | Tarih | Konu |
|---|---|---|
| `articles_seed.sql` | 2026-07-17 | 16 başlangıç makalesi |
| `specialties_fix.sql` | 2026-07-21 | Uzmanlık taksonomisi düzeltme eki |
| `titles_apply.sql` | 2026-07-22 | Unvan kısaltmalarını isimlere ekler (yedek tablo oluşturur) |
| `titles_pass2_apply.sql` | 2026-07-22 | Unvan düzeltmesi, 2. tur |
| `ankara_seo_landing.sql` | 2026-08-05 | Ankara landing içerikleri |
| `feature_top_profiles.sql` | 2026-09-02 | En iyi profilleri kalıcı olarak öne çıkarır |
| `psychology_tests_depresyon_testi.sql` | 2026-09-23 | Depresyon testi (PHQ-8) |
| `psychology_tests_update_question_wording.sql` | 2026-09-23 | Kaygı testi (GAD-7) metin güncellemesi |
| `psychology_tests_ozguven_testi.sql` | 2026-09-25 | Özgüven testi (Rosenberg) |
| `psychology_tests_baglanma_stili_testi.sql` | 2026-09-25 | Bağlanma stili testi |
| `psychology_tests_publish.sql` | 2026-09-25 | Testleri yayına alır |

### Tek seferlik temizlik (2)
| Dosya | Tarih | Konu |
|---|---|---|
| `districts_cleanup.sql` | 2026-07-21 | İlçe adı temizliği |
| `data_cleanup.sql` | 2026-07-21 | Türkçe karakter bozulmaları ve ilçe adları |

### Tanı ve önizleme sorguları (4, veri değiştirmez)
`titles_diagnostic.sql`, `titles_diagnostic2.sql`, `titles_preview.sql`, `titles_pass2_preview.sql` (2026-07-22).

### `supabase/` dışındaki SQL dosyaları
Bu dosyaların uygulanma durumu **bilinmiyor**:
- `Claude outputs/price_range_migration.sql`
- `Claude outputs/psychology_tests_set_cover_images.sql`

## Bundan sonrası için kurallar (öneri)
1. Mevcut SQL dosyaları değiştirilmez. Geçmiş kayıt olarak kalırlar.
2. Yeni dosya adı `YYYYMMDD_konu.sql` biçiminde olur (ör. `20261028_reviews_add_reply.sql`) ve yalnızca `supabase/` altına yazılır.
3. Yazım idempotent olur: `create table if not exists`, `add column if not exists`, `drop policy if exists` + `create policy`.
4. Yeni tabloda `enable row level security` ve gerekli politikalar aynı dosyada yer alır.
5. Dosyanın başına yorum olarak amaç, etkilenen tablolar ve gerekiyorsa geri alma (rollback) adımları yazılır.
6. Şema değişince `src/types/database.ts` aynı değişiklikte güncellenir.
7. Dosyayı Claude çalıştırmaz. Kullanıcı Supabase SQL Editor'da çalıştırır ve sonucu bildirir.
