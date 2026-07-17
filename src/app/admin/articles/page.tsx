'use client';

/**
 * /admin/articles — Psikoloji Rehberi içerik yönetimi.
 * Mevcut admin tek sayfalık client app desenini izler:
 * sessionStorage şifresi + x-admin-password header + liste/form görünümleri.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import ImageUpload from '@/components/admin/ImageUpload';
import { ARTICLE_CATEGORIES, ARTICLE_CATEGORY_LABELS } from '@/types/database';
import type { ArticleCategory, ArticleStatus } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────────────

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  category: ArticleCategory;
  status: ArticleStatus;
  is_featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: ArticleCategory;
  cover_image_url: string;
  meta_title: string;
  meta_description: string;
  status: ArticleStatus;
  is_featured: boolean;
  published_at: string;
};

type Flash = { type: 'success' | 'error'; text: string };

const SESSION_KEY = 'terapimap_admin_pw';

const EMPTY_FORM: FormState = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: 'genel-psikoloji',
  cover_image_url: '',
  meta_title: '',
  meta_description: '',
  status: 'draft',
  is_featured: false,
  published_at: '',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const TR_MAP: Record<string, string> = {
  ğ: 'g', ü: 'u', ş: 's', ı: 'i', ö: 'o', ç: 'c',
  Ğ: 'g', Ü: 'u', Ş: 's', İ: 'i', Ö: 'o', Ç: 'c',
};

function slugify(text: string): string {
  return text
    .split('')
    .map((c) => TR_MAP[c] ?? c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function fmtDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

/** timestamptz → datetime-local input değeri */
function toLocalInput(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ── Shared UI (admin/page.tsx stiliyle) ──────────────────────────────────────

function Btn({
  children, onClick, type = 'button', variant = 'primary', disabled, className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  className?: string;
}) {
  const styles: Record<string, string> = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
    ghost: 'text-gray-500 hover:text-gray-800 hover:bg-gray-100',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed ${styles[variant]} ${className ?? ''}`}
    >
      {children}
    </button>
  );
}

function Field({ label, required, children, hint }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {hint}
      {children}
    </div>
  );
}

const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition';

// ── Login (mevcut desenle aynı) ──────────────────────────────────────────────

function LoginForm({ onAuth }: { onAuth: (pw: string) => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (data.ok) {
        sessionStorage.setItem(SESSION_KEY, pw);
        onAuth(pw);
      } else {
        setError('Hatalı şifre. Lütfen tekrar deneyin.');
      }
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-accent-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-gray-900">Terapimap Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Devam etmek için şifrenizi girin</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="••••••••"
            required
            className={inputCls}
          />
          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <Btn type="submit" disabled={loading || !pw} className="w-full">
            {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
          </Btn>
        </form>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function AdminArticlesPage() {
  const [adminPassword, setAdminPassword] = useState<string | null>(null);
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [flash, setFlash] = useState<Flash | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) setAdminPassword(stored);
  }, []);

  const showFlash = useCallback((f: Flash) => {
    setFlash(f);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 5000);
  }, []);

  const apiFetch = useCallback(
    (path: string, options: RequestInit = {}) =>
      fetch(path, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword ?? '',
          ...((options.headers as Record<string, string>) ?? {}),
        },
      }),
    [adminPassword],
  );

  const loadArticles = useCallback(async () => {
    if (!adminPassword) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/articles');
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [adminPassword, apiFetch]);

  useEffect(() => {
    if (adminPassword) loadArticles();
  }, [adminPassword, loadArticles]);

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAdminPassword(null);
    setArticles([]);
  };

  const startNew = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setSlugTouched(false);
    setView('form');
  };

  const startEdit = async (id: string) => {
    const res = await apiFetch(`/api/admin/articles/${id}`);
    if (!res.ok) {
      showFlash({ type: 'error', text: 'İçerik yüklenemedi.' });
      return;
    }
    const { article } = await res.json();
    setForm({
      title: article.title ?? '',
      slug: article.slug ?? '',
      excerpt: article.excerpt ?? '',
      content: article.content ?? '',
      category: article.category ?? 'genel-psikoloji',
      cover_image_url: article.cover_image_url ?? '',
      meta_title: article.meta_title ?? '',
      meta_description: article.meta_description ?? '',
      status: article.status ?? 'draft',
      is_featured: Boolean(article.is_featured),
      published_at: toLocalInput(article.published_at),
    });
    setEditingId(id);
    setSlugTouched(true);
    setView('form');
  };

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      // Başlıktan slug öner — admin slug'a dokunduysa üzerine yazma
      ...(slugTouched ? {} : { slug: slugify(title) }),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      };
      const res = editingId
        ? await apiFetch(`/api/admin/articles/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await apiFetch('/api/admin/articles', { method: 'POST', body: JSON.stringify(payload) });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showFlash({ type: 'error', text: data.error ?? 'Kaydedilemedi.' });
        return;
      }
      showFlash({ type: 'success', text: editingId ? 'İçerik güncellendi.' : 'İçerik oluşturuldu.' });
      setView('list');
      setEditingId(null);
      loadArticles();
    } finally {
      setSaving(false);
    }
  };

  /** Önerilen yol: silmek yerine taslağa al. */
  const handleUnpublish = async (row: ArticleRow) => {
    const res = await apiFetch(`/api/admin/articles/${row.id}`);
    if (!res.ok) return;
    const { article } = await res.json();
    const put = await apiFetch(`/api/admin/articles/${row.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...article, status: 'draft' }),
    });
    if (put.ok) {
      showFlash({ type: 'success', text: 'İçerik taslağa alındı.' });
      loadArticles();
    }
  };

  const handleDelete = async (row: ArticleRow) => {
    // Yanlışlıkla veri kaybını önlemek için açık, yazılı onay
    const answer = window.prompt(
      `"${row.title}" kalıcı olarak silinecek ve geri alınamaz.\n` +
      'Genellikle silmek yerine "Taslağa Al" önerilir.\n\n' +
      'Silmek için kutuya SİL yazın:',
    );
    if (answer !== 'SİL') return;

    const res = await apiFetch(`/api/admin/articles/${row.id}`, { method: 'DELETE' });
    if (res.ok) {
      showFlash({ type: 'success', text: 'İçerik silindi.' });
      loadArticles();
    } else {
      const d = await res.json().catch(() => ({}));
      showFlash({ type: 'error', text: d.error ?? 'Silinemedi.' });
    }
  };

  if (!adminPassword) return <LoginForm onAuth={setAdminPassword} />;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Üst çubuk */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-900">Terapimap Admin</span>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600 font-medium">
            {view === 'form' ? (editingId ? 'İçeriği Düzenle' : 'Yeni İçerik') : 'İçerikler'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {view === 'form' ? (
            <Btn variant="ghost" onClick={() => { setView('list'); setEditingId(null); }} className="text-sm">
              ← Listeye Dön
            </Btn>
          ) : (
            <>
              <a href="/admin" className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">
                Profesyoneller
              </a>
              <a href="/admin/leads" className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">
                Leads
              </a>
              <Btn onClick={startNew}>+ Yeni İçerik</Btn>
            </>
          )}
          <Btn variant="ghost" onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-600 hover:bg-red-50">
            Çıkış
          </Btn>
        </div>
      </div>

      {/* Flash */}
      {flash && (
        <div className={`mx-6 mt-4 rounded-lg px-4 py-3 text-sm ${flash.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {flash.text}
        </div>
      )}

      <div className="p-6">
        {view === 'list' ? (
          /* ── Liste ── */
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {loading ? (
              <p className="p-6 text-sm text-gray-500">Yükleniyor…</p>
            ) : articles.length === 0 ? (
              <p className="p-6 text-sm text-gray-500">
                Henüz içerik yok. &quot;Yeni İçerik&quot; ile ilk rehberinizi oluşturun.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Başlık</th>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3">Durum</th>
                      <th className="px-4 py-3">Öne Çıkan</th>
                      <th className="px-4 py-3">Yayın</th>
                      <th className="px-4 py-3">Güncelleme</th>
                      <th className="px-4 py-3 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {articles.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{row.title}</div>
                          <div className="text-xs text-gray-400">/{row.slug}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {ARTICLE_CATEGORY_LABELS[row.category] ?? row.category}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border ${row.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                            {row.status === 'published' ? 'Yayında' : 'Taslak'}
                          </span>
                        </td>
                        <td className="px-4 py-3">{row.is_featured ? '★' : '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{fmtDate(row.published_at)}</td>
                        <td className="px-4 py-3 text-gray-600">{fmtDate(row.updated_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            <Btn variant="secondary" onClick={() => startEdit(row.id)} className="!px-3 !py-1.5 text-xs">
                              Düzenle
                            </Btn>
                            {row.status === 'published' && (
                              <Btn variant="secondary" onClick={() => handleUnpublish(row)} className="!px-3 !py-1.5 text-xs">
                                Taslağa Al
                              </Btn>
                            )}
                            <Btn variant="danger" onClick={() => handleDelete(row)} className="!px-3 !py-1.5 text-xs">
                              Sil
                            </Btn>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit} className="max-w-3xl space-y-5 bg-white rounded-xl border border-gray-200 p-6">
            <Field label="Başlık" required>
              <input className={inputCls} value={form.title} onChange={(e) => handleTitleChange(e.target.value)} required />
            </Field>

            <Field label="Slug" required hint={
              <p className="text-xs text-gray-400 mb-1">URL: /psikoloji-rehberi/{form.slug || '…'}</p>
            }>
              <input
                className={inputCls}
                value={form.slug}
                onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }}
                required
              />
            </Field>

            <Field label="Kısa Açıklama (Excerpt)" required>
              <textarea className={`${inputCls} min-h-[70px]`} value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} required />
            </Field>

            <Field label="İçerik (Markdown)" required hint={
              <div className="mb-1.5 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-500 space-y-0.5">
                <p className="font-medium text-gray-600">Markdown ipuçları:</p>
                <p><code>## Alt başlık</code> · <code>### Küçük başlık</code> · <code>- Liste</code> · <code>**Kalın metin**</code> · <code>[Bağlantı metni](URL)</code></p>
              </div>
            }>
              <textarea className={`${inputCls} min-h-[320px] font-mono text-xs`} value={form.content} onChange={(e) => set('content', e.target.value)} required />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Kategori" required>
                <select className={inputCls} value={form.category} onChange={(e) => set('category', e.target.value as ArticleCategory)}>
                  {ARTICLE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{ARTICLE_CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Durum" required>
                <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value as ArticleStatus)}>
                  <option value="draft">Taslak</option>
                  <option value="published">Yayında</option>
                </select>
              </Field>
            </div>

            <Field label="Kapak Görseli">
              <ImageUpload
                currentUrl={form.cover_image_url}
                onUploaded={(url) => set('cover_image_url', url)}
                adminPassword={adminPassword}
              />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Meta Title">
                <input className={inputCls} value={form.meta_title} onChange={(e) => set('meta_title', e.target.value)} />
              </Field>
              <Field label="Meta Description">
                <input className={inputCls} value={form.meta_description} onChange={(e) => set('meta_description', e.target.value)} />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Yayın Tarihi" hint={
                <p className="text-xs text-gray-400 mb-1">Boş bırakılırsa yayınlarken otomatik atanır.</p>
              }>
                <input type="datetime-local" className={inputCls} value={form.published_at} onChange={(e) => set('published_at', e.target.value)} />
              </Field>
              <label className="flex items-center gap-2 self-end pb-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => set('is_featured', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-400"
                />
                Öne çıkan içerik (ana sayfada gösterilir)
              </label>
            </div>

            <div className="flex items-center gap-3 border-t border-gray-100 pt-5">
              <Btn type="submit" disabled={saving}>
                {saving ? 'Kaydediliyor…' : editingId ? 'Güncelle' : 'Oluştur'}
              </Btn>
              <Btn variant="secondary" onClick={() => { setView('list'); setEditingId(null); }}>
                Vazgeç
              </Btn>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
