-- ─────────────────────────────────────────────────────────────────────
-- Belge Yükleme (Faz 1): terapistlerin diploma/sertifika/ek fotoğraf gibi
-- belgelerini yükleyebildiği, HERKESE AÇIK ve admin ön-onayı OLMAYAN alan.
--
-- Mevcut therapist_verification_requests moderasyon kuyruğundan bilinçli
-- olarak farklı: mevcut (zaten yayında) terapistler belge yükleyince
-- doğrudan professionals.documents dizisine yazılır ve anında herkese
-- görünür olur. Admin yalnızca sonradan kaldırabilir.
--
-- documents jsonb şeması — her eleman:
--   { "url": string, "name": string, "type": "pdf"|"image", "uploaded_at": ISO8601 string }
-- ─────────────────────────────────────────────────────────────────────

-- 1. professionals.documents — yayındaki profilin belgeleri
alter table public.professionals
  add column if not exists documents jsonb not null default '[]'::jsonb;

-- 2. therapist_verification_requests.documents — yeni başvuru sırasında
--    seçilen belgeler; admin onayladığında professionals.documents'a
--    kopyalanır (bkz. admin approve route).
alter table public.therapist_verification_requests
  add column if not exists documents jsonb not null default '[]'::jsonb;

-- ─────────────────────────────────────────────────────────────────────
-- 3. Storage bucket: therapist-documents (create if not exists)
--    Supabase Dashboard → Storage → New Bucket ile de oluşturulabilir.
--    Name: therapist-documents, Public: true
--    (PDF + JPG/PNG/WebP; panel/upload-document route'unda 10 MB sınırı var,
--    burada ayrıca bir dosya boyutu sınırı tanımlanmadı — istersen Dashboard'dan
--    "File size limit" alanına 10 MB girebilirsin.)
-- ─────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('therapist-documents', 'therapist-documents', true)
on conflict (id) do nothing;

drop policy if exists "therapist-documents public read" on storage.objects;
create policy "therapist-documents public read"
  on storage.objects for select
  using (bucket_id = 'therapist-documents');

-- Panel'den (oturumlu terapist) ve başvuru formundan (herkese açık, henüz
-- profili olmayan başvuranlar için) yükleme yapılabilmesi gerekiyor —
-- her iki route da service-role client kullanıyor, o yüzden bu policy
-- pratikte yalnızca dashboard/CLI üzerinden yapılan denemeler için devrede.
-- Route'lar zaten kendi içlerinde oturum/başvuru doğrulaması yapıyor.
drop policy if exists "therapist-documents service upload" on storage.objects;
create policy "therapist-documents service upload"
  on storage.objects for insert
  with check (bucket_id = 'therapist-documents');

drop policy if exists "therapist-documents service delete" on storage.objects;
create policy "therapist-documents service delete"
  on storage.objects for delete
  using (bucket_id = 'therapist-documents');
