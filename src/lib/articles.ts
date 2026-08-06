/**
 * Psikoloji Rehberi — public sorgu katmanı.
 * Tüm okumalar anon server client ile yapılır; RLS yalnızca yayınlanmış
 * içerikleri döndürür. Yine de sorgularda status/published_at filtresi
 * açıkça uygulanır (defense in depth).
 */
import { getPublicClient } from './supabase/server';
import { ARTICLE_CATEGORIES } from '@/types/database';
import type { Article, ArticleCategory, ArticleListItem } from '@/types/database';

/**
 * Kategori hub sayfaları (/psikoloji-rehberi/kategori/[kategori]) için
 * özgün SEO içerikleri. Her kategori kendi indexlenebilir URL'ine sahiptir.
 */
export const CATEGORY_CONTENT: Record<
  ArticleCategory,
  { title: string; intro: string; metaTitle: string; metaDescription: string }
> = {
  'terapi-rehberi': {
    title: 'Terapi Rehberi',
    intro:
      'Terapiye başlamak çoğu insan için belirsizliklerle dolu bir süreçtir: Doğru terapist nasıl seçilir, ilk seansta ne olur, ücretler neye göre belirlenir? Bu kategorideki rehberler, terapi sürecinin pratik yönlerini — uzman seçiminden seans sıklığına, online terapiden ücret planlamasına kadar — net ve güvenilir bir dille anlatır. Amacımız, profesyonel destek almaya karar verdiğinizde yolunuzu kolaylaştırmak.',
    metaTitle: 'Terapi Rehberi: Terapist Seçimi, Ücretler ve Süreç | Terapimap',
    metaDescription:
      'Terapiye başlama, doğru terapist seçimi, seans ücretleri ve terapi süreci hakkında pratik rehberler. Terapimap Psikoloji Rehberi.',
  },
  'psikolojik-konular': {
    title: 'Psikolojik Konular',
    intro:
      'Anksiyete, depresyon, panik atak, tükenmişlik… Bu kategorideki içerikler, en sık yaşanan psikolojik zorlukların belirtilerini, nedenlerini ve başa çıkma yollarını bilimsel kaynaklara dayanarak anlatır. Kendi yaşadıklarınızı anlamlandırmanıza ve ne zaman profesyonel destek almanız gerektiğine karar vermenize yardımcı olmayı hedefler; tanı veya tedavi yerine geçmez.',
    metaTitle: 'Psikolojik Konular: Anksiyete, Depresyon ve Daha Fazlası | Terapimap',
    metaDescription:
      'Anksiyete, depresyon, panik atak ve diğer psikolojik konuların belirtileri ve başa çıkma yolları. Anlaşılır ve güvenilir içerikler.',
  },
  'terapi-yontemleri': {
    title: 'Terapi Yöntemleri',
    intro:
      "BDT, EMDR, şema terapi, psikodinamik terapi… Farklı terapi ekolleri farklı sorunlara ve farklı kişilere uygundur. Bu kategorideki rehberler her yöntemin nasıl işlediğini, hangi durumlarda etkili olduğunu ve seansların nasıl geçtiğini anlatır — böylece terapist ararken 'hangi yaklaşım bana uygun?' sorusuna bilinçli bir yanıt verebilirsiniz.",
    metaTitle: 'Terapi Yöntemleri: BDT, EMDR, Şema Terapi | Terapimap',
    metaDescription:
      'Bilişsel davranışçı terapi, EMDR, şema terapi ve diğer terapi yöntemleri nasıl işler, kimler için uygundur? Kapsamlı yöntem rehberleri.',
  },
  'cocuk-ve-ergen': {
    title: 'Çocuk ve Ergen',
    intro:
      'Çocuğunuzun ya da ergen yaştaki gencinizin ruh sağlığıyla ilgili endişeleriniz mi var? Bu kategorideki içerikler; hangi davranışların gelişimsel olarak normal olduğunu, hangi işaretlerin profesyonel değerlendirme gerektirdiğini ve çocuklar için doğru uzmanın nasıl seçileceğini ebeveyn gözünden, pratik bir dille ele alır.',
    metaTitle: 'Çocuk ve Ergen Psikolojisi: Ebeveyn Rehberleri | Terapimap',
    metaDescription:
      'Çocuk ve ergenlerde ruh sağlığı işaretleri, psikolog seçimi ve sınav kaygısı gibi konularda ebeveynlere yönelik pratik rehberler.',
  },
  'iliskiler': {
    title: 'İlişkiler',
    intro:
      'Sağlıklı ilişkiler kendiliğinden oluşmaz; iletişim becerileri, sınırlar ve karşılıklı anlayış ister. Bu kategorideki rehberler çift terapisinden ilişki dinamiklerine, tekrarlayan tartışma döngülerinden bağlanma stillerine kadar ilişkilerin psikolojisini ele alır — ister ilişkinizi güçlendirmek, ister zorlu bir dönemi aşmak istiyor olun.',
    metaTitle: 'İlişkiler: Çift Terapisi ve İlişki Psikolojisi | Terapimap',
    metaDescription:
      'Çift terapisi, iletişim becerileri ve sağlıklı ilişki dinamikleri üzerine rehberler. İlişkinizi güçlendirecek güvenilir içerikler.',
  },
  'genel-psikoloji': {
    title: 'Genel Psikoloji',
    intro:
      'Zihnimiz nasıl çalışır, duygularımız bizi nasıl yönlendirir, alışkanlıklar nasıl değişir? Bu kategorideki içerikler psikolojinin günlük yaşama dokunan konularını — öz şefkatten stres yönetimine, motivasyondan uyku psikolojisine — bilimsel ama anlaşılır bir dille ele alır.',
    metaTitle: 'Genel Psikoloji: Günlük Yaşamın Psikolojisi | Terapimap',
    metaDescription:
      'Öz şefkat, stres yönetimi, motivasyon ve günlük yaşam psikolojisi üzerine anlaşılır içerikler. Terapimap Psikoloji Rehberi.',
  },
};

/**
 * Makale kategorisi → uzmanlık landing sayfası (CTA hedefi).
 * Eşleşme yoksa CTA genel terapist listesine gider.
 */
export const CATEGORY_CTA_SPECIALTY: Partial<Record<ArticleCategory, string>> = {
  'cocuk-ve-ergen': 'cocuk-psikolojisi',
  'iliskiler': 'cift-terapisi',
};

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
  const supabase = getPublicClient();
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
  const supabase = getPublicClient();
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
  const supabase = getPublicClient();
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
  const supabase = getPublicClient();
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
  const supabase = getPublicClient();
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
