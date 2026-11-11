-- Amaç: Şimdiye kadar WhatsApp'tan doğrulama daveti gönderilen 33 numarayı
--   (masaüstü: "whatsapp  gönderilenler.xlsx") professionals tablosunda işaretlemek.
--   "onayladı" yazan 2 kişi ayrıca whatsapp_replied_at ile "dönüş yaptı" işaretlenir.
-- Etkilenen tablo: public.professionals (whatsapp_invited_at, whatsapp_invite_count, whatsapp_replied_at)
-- Bağımlılık: 20261111_whatsapp_outreach.sql (kolonlar önce eklenmiş olmalı)
-- Eşleştirme: telefon rakamlarının son 10 hanesi (5XXXXXXXXX). İsim eşleştirmesi kullanılmaz.
-- Tarih: gönderim günü bilinmediği için now() kullanılır; zaten işaretli kayıtlara dokunulmaz.
-- Not: "elif guran" numarası dosyada yok (numarayı engellemiş), bu yüzden işaretlenmedi;
--   gerekirse /admin/dogrulama-takibi sayfasından elle işaretlenir.
-- Geri alma:
--   update public.professionals set whatsapp_invited_at = null, whatsapp_invite_count = 0,
--     whatsapp_replied_at = null
--   where id in (<ADIM 1 sorgusunun döndürdüğü id'ler>);

-- ADIM 1 — ÖNİZLEME (hiçbir şey yazmaz). Önce yalnızca bu bloğu çalıştırın.
-- "profil_id" boş olan satır = veritabanında o numarayla eşleşen profil yok.
with numaralar(tel, ad, onayladi) as (
  values
    ('5016654915', 'Elida Psikoloji', false),
    ('5320552487', 'Özlem Hekim', false),
    ('5443901215', 'Paradoks Psikoloji', false),
    ('5010704051', 'Psikomega', false),
    ('5057240211', 'Ahmet burak topaloğlu', false),
    ('5442269448', 'beyza mermer', false),
    ('5519365612', 'burcu aksongur', false),
    ('5330477570', 'Beste güven', false),
    ('5421222608', 'bilge uğurlu kuru', false),
    ('5330511674', 'cansu Aydın', false),
    ('5553802045', 'mehmet emin kızgın', true),
    ('5520952931', 'eylül turan', false),
    ('5433152134', 'emir can kara', false),
    ('5050254400', 'melis karakaya', false),
    ('5316160684', 'damla tekin', false),
    ('5050536406', 'damla yiğiteli', false),
    ('5438984868', 'melek akbayrak', false),
    ('5067174517', 'deniz eryılmaz', false),
    ('5307978048', 'sıla doğanlar', false),
    ('5524187973', 'Hazal Akşahin', false),
    ('5421806628', 'gizem ulusoy', false),
    ('5071421516', 'hatice merve camuzcu', false),
    ('5413418033', 'merve türkan', false),
    ('5467239790', 'semanur yıldız', false),
    ('5368354500', '(isimsiz)', true),
    ('5323332471', '(isimsiz)', false),
    ('5532774026', 'sevilay bozkurt', false),
    ('5351643545', 'leyla çolak kaya', false),
    ('5434912150', 'Ayça can uz', false),
    ('5469510677', 'pınar aygündüz', false),
    ('5052585246', 'şule şahin - dilem psikoloji', false),
    ('5446015241', 'ayfer duman', false)
)
select n.tel, n.ad as excel_adi, n.onayladi,
       p.id as profil_id, p.name as profil_adi, p.city, p.is_verified,
       p.whatsapp_invited_at as zaten_isaretli
from numaralar n
left join public.professionals p
  on right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 10) = n.tel
order by (p.id is null) desc, n.ad;

-- ADIM 2 — UYGULAMA. Önizlemeyi kontrol ettikten sonra aşağıdaki bloğu çalıştırın.
-- (Adım 1'i çalıştırırken bu bloğun yorumda kalması için "/*" ile "*/" arasına alındı;
--  çalıştırmak için bu iki işareti silin.)
/*
with numaralar(tel, onayladi) as (
  values
    ('5016654915', false), ('5320552487', false), ('5443901215', false), ('5010704051', false),
    ('5057240211', false), ('5442269448', false), ('5519365612', false), ('5330477570', false),
    ('5421222608', false), ('5330511674', false), ('5553802045', true),  ('5520952931', false),
    ('5433152134', false), ('5050254400', false), ('5316160684', false), ('5050536406', false),
    ('5438984868', false), ('5067174517', false), ('5307978048', false), ('5524187973', false),
    ('5421806628', false), ('5071421516', false), ('5413418033', false), ('5467239790', false),
    ('5368354500', true),  ('5323332471', false), ('5532774026', false), ('5351643545', false),
    ('5434912150', false), ('5469510677', false), ('5052585246', false), ('5446015241', false)
)
update public.professionals p
set whatsapp_invited_at   = coalesce(p.whatsapp_invited_at, now()),
    whatsapp_invite_count = greatest(p.whatsapp_invite_count, 1),
    whatsapp_replied_at   = case when n.onayladi then coalesce(p.whatsapp_replied_at, now())
                                 else p.whatsapp_replied_at end
from numaralar n
where right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 10) = n.tel
  -- Önizlemede aynı numarayı paylaşan, mesaj ATILMAMIŞ profiller hariç tutulur:
  --   5524187973 → yalnızca Hazal Akşahin (Selin Baysal, RN Psikoloji, Rojin Nazik hariç)
  --   5307978048 → yalnızca Sıla Doğanlar (Serenay Ercan hariç)
  and p.id not in (
    '91e3255c-8357-45fb-b4c4-c2c8164802b6',
    'a94967ae-7b0f-464d-a9dc-d1d4e3f6b919',
    'dabb0468-0c7a-4c68-a940-91abaa87b6cd',
    '5e394676-b2b2-4f55-8303-9c2c4667fa91'
  );
*/

-- ADIM 3 (isteğe bağlı) — Önizlemede eşleşmeyen 4 numara için isimle arama (yazmaz).
-- Profilin telefonu farklı kayıtlıysa buradan bulunur; bulunanlar /admin/dogrulama-takibi
-- sayfasından elle işaretlenebilir.
-- select id, name, city, phone, status from public.professionals
--  where name ilike '%elida%' or name ilike '%leyla%çolak%' or name ilike '%merve%türkan%'
--     or name ilike '%sevilay%bozkurt%';

-- Çalıştırma sonrası kontrol:
-- select count(*) filter (where whatsapp_invited_at is not null) as isaretli,
--        count(*) filter (where whatsapp_replied_at is not null) as donus
-- from public.professionals;
