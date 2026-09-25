-- Üç testi de yayına alır (is_published = true).
-- Sadece belirli testleri yayınlamak istersen `slug in (...)` listesini
-- daraltabilirsin, örn. sadece: slug = 'ozguven-testi'
update public.psychology_tests
set is_published = true
where slug in ('kaygi-testi', 'depresyon-testi', 'ozguven-testi');

-- Kontrol için:
select slug, title_tr, is_published from public.psychology_tests order by created_at;
