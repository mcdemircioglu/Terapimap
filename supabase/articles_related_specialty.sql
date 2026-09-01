-- ── Makale → uzmanlık ilişkisi (rehber CTA hedefi) ───────────────────
-- Önceden rehber makalesinin "uzmanlarla görüş" CTA'sı yalnızca kod
-- içindeki sabit haritalara (ARTICLE_SLUG_CTA_SPECIALTY / CATEGORY_CTA_SPECIALTY,
-- src/lib/articles.ts) bakıyordu; yeni bir makale eklendiğinde doğru uzmanlık
-- sayfasına yönlenmesi için her seferinde koda dokunmak gerekiyordu.
-- Bu kolon, admin panelinden (veya psikoloji-rehberi pipeline'ının önerdiği
-- frontmatter alanından) doğrudan doldurulabilir; doluysa öncelik alır,
-- boşsa mevcut kod haritalarına düşülür (geriye dönük uyumluluk).
alter table public.articles
  add column if not exists related_specialty_slug text
    references public.specialties(slug) on delete set null;

create index if not exists articles_related_specialty_idx
  on public.articles (related_specialty_slug);
