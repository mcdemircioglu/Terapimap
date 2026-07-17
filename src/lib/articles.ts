/**
 * Psikoloji Rehberi — public sorgu katmanı.
 * Tüm okumalar anon server client ile yapılır; RLS yalnızca yayınlanmış
 * içerikleri döndürür. Yine de sorgularda status/published_at filtresi
 * açıkça uygulanır (defense in depth).
 */
import { getServerClient } from './supabase/server';
import { ARTICLE_CATEGORIES } from '@/types/database';
import type { Article, ArticleCategory, ArticleListItem } from '@/types/database';

function logError(fn: string, error: unknown) {
  console.error(`\n[terapimap:articles] ${fn} failed:`);
  console.error(JSON.stringify(error, null, 2));
}

/** Liste sorguları content gövdesini ÇEKMEZ; okuma süresi DB'de hesaplanır. */
const ARTICLE_LIST_SELECT =
  'id, title, slug, excerpt, category, cover_image_url, is_featured, published_at, reading_minutes';

const nowIso = () => new Date().toISOString();

export async function getPublishedArticles(opts?: {
  category?: ArticleCategory;
  limit?: number;
}): Promise<ArticleListItem[]> {
  const supabase = getServerClient();
  let query = supabase
    .from('articles')
    .select(ARTICLE_LIST_SELECT)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', nowIso())
    .order('published_at', { ascending: false });

  if (opts?.category) query = query.eq('category', opts.category);
  if (opts?.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) {
    logError('getPublishedArticles', error);
    return [];
  }
  return (data ?? []) as unknown as ArticleListItem[];
}

/** Öne çıkanlar; yeterli featured içerik yoksa en yeni yayınlarla tamamlanır. */
export async function getFeaturedArticles(limit = 4): Promise<ArticleListItem[]> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_LIST_SELECT)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', nowIso())
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    logError('getFeaturedArticles', error);
    return [];
  }
  return (data ?? []) as unknown as ArticleListItem[];
}

/** Detay sayfası — tam satır. Draft içerikler RLS + filtre ile asla dönmez. */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', nowIso())
    .maybeSingle();

  if (error) {
    logError('getArticleBySlug', error);
    return null;
  }
  return (data as Article) ?? null;
}

/** Aynı kategoriden benzer içerikler. */
export async function getRelatedArticles(
  category: ArticleCategory,
  excludeId: string,
  limit = 3,
): Promise<ArticleListItem[]> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from('articles')
    .select(ARTICLE_LIST_SELECT)
    .eq('status', 'published')
    .eq('category', category)
    .neq('id', excludeId)
    .not('published_at', 'is', null)
    .lte('published_at', nowIso())
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    logError('getRelatedArticles', error);
    return [];
  }
  return (data ?? []) as unknown as ArticleListItem[];
}

/** Sitemap için: yalnızca loc/lastmod üretmeye yetecek alanlar. */
export async function getArticlesForSitemap(): Promise<
  { slug: string; updated_at: string; published_at: string | null }[]
> {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from('articles')
    .select('slug, updated_at, published_at')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', nowIso())
    .order('published_at', { ascending: false });

  if (error) {
    logError('getArticlesForSitemap', error);
    return [];
  }
  return data ?? [];
}

/** İstemci tarafı yedek hesap (DB fonksiyonu ile aynı formül: ~200 kelime/dk). */
export function calculateReadingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Admin API form doğrulaması (route handler'lardan paylaşımlı).
 * Route dosyaları yalnızca HTTP metodları export edebildiği için burada yaşar.
 */
export function validateArticlePayload(body: any): { error?: string; data?: Record<string, unknown> } {
  const title = String(body.title ?? '').trim();
  const slug = String(body.slug ?? '').trim();
  const excerpt = String(body.excerpt ?? '').trim();
  const content = String(body.content ?? '').trim();
  const category = String(body.category ?? '').trim();
  const status = String(body.status ?? 'draft').trim();

  if (!title) return { error: 'Başlık zorunludur.' };
  if (!slug) return { error: 'Slug zorunludur.' };
  if (!SLUG_RE.test(slug)) return { error: 'Slug yalnızca küçük harf, rakam ve tire içerebilir.' };
  if (!excerpt) return { error: 'Kısa açıklama zorunludur.' };
  if (!content) return { error: 'İçerik zorunludur.' };
  if (!(ARTICLE_CATEGORIES as readonly string[]).includes(category)) {
    return { error: 'Geçersiz kategori.' };
  }
  if (status !== 'draft' && status !== 'published') {
    return { error: 'Durum yalnızca draft veya published olabilir.' };
  }

  // published_at yönetimi: yayınlanan içerikte tarih yoksa şimdi ata;
  // taslakta gönderilen tarih korunur (ileri tarihli planlamaya izin verir).
  let published_at: string | null = body.published_at ? String(body.published_at) : null;
  if (status === 'published' && !published_at) published_at = new Date().toISOString();
  if (published_at && Number.isNaN(Date.parse(published_at))) {
    return { error: 'Geçersiz yayın tarihi.' };
  }

  return {
    data: {
      title,
      slug,
      excerpt,
      content,
      category,
      status,
      published_at,
      cover_image_url: String(body.cover_image_url ?? '').trim() || null,
      meta_title: String(body.meta_title ?? '').trim() || null,
      meta_description: String(body.meta_description ?? '').trim() || null,
      is_featured: Boolean(body.is_featured),
    },
  };
}
