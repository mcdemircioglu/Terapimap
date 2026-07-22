-- =====================================================================
-- 2. PASS — atlanan KİŞİ kayıtlarının elle doğrulanmış düzeltmeleri
-- (Kurumlar hariç; her isim tek tek gözden geçirildi.)
-- Idempotent: id bazlı, tekrar çalıştırmak sorun çıkarmaz.
-- =====================================================================
update public.professionals as p
set name = v.yeni, updated_at = now()
from (values
  ('66c867aa-aeed-4935-974e-0b36cde0c734'::uuid, 'Uzm. Kln. Psk. Cem Doğan'),
  ('70337828-3c80-485c-896b-66c3c68a52fe'::uuid, 'Uzm. Kln. Psk. Can Yılmaz'),
  ('ffe544f8-c777-473c-8c3a-b83368d1c0a1'::uuid, 'Doç. Dr. İbrahim Gündoğmuş'),
  ('c39d609a-e402-4bcf-ac15-627931ee6b43'::uuid, 'Uzm. Dr. E. Cengiz Albayrak'),
  ('7c977a16-bd68-4ab1-b48b-1db9a67fa8d4'::uuid, 'Uzm. Dr. Olga Gökbulut'),
  ('943ed31f-4b3c-46e1-9abe-4d7ce5f83688'::uuid, 'Uzm. Dr. Çağlar Jaicks'),
  ('407e79fa-12ac-4d30-8085-9e2d2fe8323c'::uuid, 'Uzm. Dr. Serhat Ergün'),
  ('013e7a7c-78fc-4734-802c-3fe264717dbc'::uuid, 'Doç. Dr. Alişan Burak Yaşar'),
  ('451923b8-844a-44f9-9aa6-57acbd0f7d2d'::uuid, 'Prof. Dr. Oğuz Berksun'),
  ('c704ba27-8ce1-4ef0-bf79-bcdf93895991'::uuid, 'Uzm. Psk. Aslı Demirel'),
  ('1b27190a-2265-45a8-abd1-305395aeb70a'::uuid, 'Uzm. Psk. Berken Gündüz'),
  ('375ac450-0a6d-4334-b134-02b86e06fc2a'::uuid, 'Psk. Betül Erdoğan Fındıklı'),
  ('79e2418f-35bd-4d6f-af01-a29822ccc733'::uuid, 'Psk. Abdullah Gürleroğlu'),
  ('6fd9ecca-3393-4bc2-a0e9-e7931d5986ea'::uuid, 'Psk. Nihan Dikme'),
  ('1f95cfce-556b-41d5-a5d7-3b6ee94be685'::uuid, 'Psk. Şahin Uçar'),
  ('1f95cfce-556b-41d5-a5d7-3b6ee94be685'::uuid, 'Psk. Vildan Karsan'),
  ('5e68fe05-3252-4ca7-9a63-8366804b9c41'::uuid, 'Psk. Cengiz İpek'),
  ('f9a604e4-7322-46cb-aa13-97e29ee659e3'::uuid, 'Psk. Feyza Karakoç'),
  ('603fd150-8ce5-4ec8-8bff-36c3048d8552'::uuid, 'Psk. Hilal Uçak'),
  ('33f509d3-30dd-420a-94d5-1bac71413507'::uuid, 'Psk. Büşra Kordağ'),
  ('349b59fd-a599-4743-89d4-084eb76cab84'::uuid, 'Psk. Burcu Koray'),
  ('25d59121-5399-466d-b849-1049db0045d8'::uuid, 'Psk. Serap Yanlar'),
  ('a95e61ac-ff5c-4c34-844a-75011dc61b5e'::uuid, 'Uzm. Kln. Psk. Ebru Behçel'),
  ('b158a323-0d30-4bc8-8c53-49d4173c9e55'::uuid, 'Uzm. Kln. Psk. Özlem Efe'),
  ('8896aa02-32b3-4443-856c-9a24fc48c0c3'::uuid, 'Uzm. Psk. Necla Akçiçek')
) as v(id, yeni)
where p.id = v.id;

-- Ek: noktalaması bozuk tek kayıt
update public.professionals
set name = 'Uzm. Kln. Psk. Yasemin Oltulu', updated_at = now()
where removed_at is null
  and name ilike 'Uzm %Kln%Psk%Yasemin Oltulu%';

-- Kontrol
select name, professional_type, title
from public.professionals
where id in ('66c867aa-aeed-4935-974e-0b36cde0c734', '70337828-3c80-485c-896b-66c3c68a52fe', 'ffe544f8-c777-473c-8c3a-b83368d1c0a1', 'c39d609a-e402-4bcf-ac15-627931ee6b43', '7c977a16-bd68-4ab1-b48b-1db9a67fa8d4', '943ed31f-4b3c-46e1-9abe-4d7ce5f83688', '407e79fa-12ac-4d30-8085-9e2d2fe8323c', '013e7a7c-78fc-4734-802c-3fe264717dbc', '451923b8-844a-44f9-9aa6-57acbd0f7d2d', 'c704ba27-8ce1-4ef0-bf79-bcdf93895991', '1b27190a-2265-45a8-abd1-305395aeb70a', '375ac450-0a6d-4334-b134-02b86e06fc2a', '79e2418f-35bd-4d6f-af01-a29822ccc733', '6fd9ecca-3393-4bc2-a0e9-e7931d5986ea', '1f95cfce-556b-41d5-a5d7-3b6ee94be685', '1f95cfce-556b-41d5-a5d7-3b6ee94be685', '5e68fe05-3252-4ca7-9a63-8366804b9c41', 'f9a604e4-7322-46cb-aa13-97e29ee659e3', '603fd150-8ce5-4ec8-8bff-36c3048d8552', '33f509d3-30dd-420a-94d5-1bac71413507', '349b59fd-a599-4743-89d4-084eb76cab84', '25d59121-5399-466d-b849-1049db0045d8', 'a95e61ac-ff5c-4c34-844a-75011dc61b5e', 'b158a323-0d30-4bc8-8c53-49d4173c9e55', '8896aa02-32b3-4443-856c-9a24fc48c0c3')
order by name;
