'use client';

/**
 * /panel/blog — "Blog Yazılarım".
 *
 * Terapist burada kendi makalelerini yazar; admin/articles ile aynı
 * `articles` tablosunu kullanır ama terapist yalnızca draft/pending'e
 * geçebilir — published yalnızca admin onayıyla olur (bkz.
 * /api/panel/articles route yorumları). Admin onaylayınca yazı
 * Psikoloji Rehberi'nde görünür; yayındaki bir yazıyı burada düzenlemek
 * değişikliği anında yayına yansıtır (yeniden onay istenmez).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ARTICLE_CATEGORIES, ARTICLE_CATEGORY_LABELS } from '@/types/database';
import type { ArticleCategory, ArticleStatus } from '@/types/database';

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  category: ArticleCategory;
  status: ArticleStatus;
  cover_image_url: string | null;
  admin_note: string | null;
  published_at: string | null;
  updated_at: string;
};

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: ArticleCategory;
  cover_image_url: string;
  related_specialty_slug: string;
};

const EMPTY_FORM: FormState = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: 'genel-psikoloji',
  cover_image_url: '',
  related_specialty_slug: '',
};

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
  return new Date(value).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const STATUS_LABELS: Record<ArticleStatus, { label: string; cls: string }> = {
  draft: { label: 'Taslak', cls: 'bg-gray-100 text-gray-600' },
  pending: { label: 'İncelemede', cls: 'bg-yellow-50 text-yellow-700' },
  published: { label: 'Yayında', cls: 'bg-green-50 text-green-700' },
  rejected: { label: 'Reddedildi', cls: 'bg-red-50 text-red-600' },
};

export default function PanelBlogPage() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<ArticleStatus | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/panel/articles');
      const data = await res.json().catch(() => ({}));
      if (res.ok) setArticles(data.articles ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({ ...prev, title, ...(slugTouched ? {} : { slug: slugify(title) }) }));
  };

  const startNew = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setEditingStatus(null);
    setEditingNote(null);
    setSlugTouched(false);
    setError(null);
    setView('form');
  };

  const startEdit = async (id: string) => {
    setError(null);
    const res = await fetch(`/api/panel/articles/${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setFlash(data.error ?? 'Yazı yüklenemedi.');
      return;
    }
    const a = data.article;
    setForm({
      title: a.title ?? '',
      slug: a.slug ?? '',
      excerpt: a.excerpt ?? '',
      content: a.content ?? '',
      category: a.category ?? 'genel-psikoloji',
      cover_image_url: a.cover_image_url ?? '',
      related_specialty_slug: a.related_specialty_slug ?? '',
    });
    setEditingId(id);
    setEditingStatus(a.status);
    setEditingNote(a.admin_note ?? null);
    setSlugTouched(true);
    setView('form');
  };

  const backToList = () => {
    setView('list');
    loadArticles();
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCoverUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/panel/upload-article-cover', { method: 'POST', body: fd });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? 'Görsel yüklenemedi.');
        return;
      }
      set('cover_image_url', d.url);
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setCoverUploading(false);
    }
  };

  const submit = async (action: 'save_draft' | 'submit') => {
    setError(null);
    if (!form.title.trim()) return setError('Başlık zorunludur.');
    if (!form.excerpt.trim()) return setError('Kısa açıklama zorunludur.');
    if (!form.content.trim()) return setError('İçerik zorunludur.');

    setSaving(true);
    try {
      const payload = { ...form, action };
      const res = editingId
        ? await fetch(`/api/panel/articles/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/panel/articles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Kaydedilemedi.');
        return;
      }
      setFlash(
        editingStatus === 'published'
          ? 'Değişiklikler yayına yansıtıldı.'
          : action === 'submit'
            ? 'Yazı incelemeye gönderildi.'
            : 'Taslak kaydedildi.',
      );
      backToList();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: ArticleRow) => {
    if (row.status === 'published') return;
    if (!window.confirm(`"${row.title}" taslağını silmek istediğinizden emin misiniz?`)) return;
    const res = await fetch(`/api/panel/articles/${row.id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setFlash(data.error ?? 'Silinemedi.');
      return;
    }
    setFlash('Taslak silindi.');
    loadArticles();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-brand-900">Blog Yazılarım</h1>
          <p className="text-sm text-brand-500">
            Yazdığınız içerikler admin onayından sonra Psikoloji Rehberi&apos;nde yayınlanır.
          </p>
        </div>
        {view === 'list' && <Button onClick={startNew}>+ Yeni Yazı</Button>}
      </div>

      {flash && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {flash}
        </div>
      )}

      {view === 'list' ? (
        <Card className="p-0 overflow-hidden">
          {loading ? (
            <p className="p-6 text-sm text-brand-500">Yükleniyor...</p>
          ) : articles.length === 0 ? (
            <p className="p-6 text-sm text-brand-500">
              Henüz bir yazınız yok. &quot;+ Yeni Yazı&quot; ile ilk makalenizi oluşturun.
            </p>
          ) : (
            <div className="divide-y divide-brand-100">
              {articles.map((row) => {
                const s = STATUS_LABELS[row.status];
                return (
                  <div key={row.id} className="flex items-start justify-between gap-3 p-4 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-brand-900">{row.title}</p>
                      <p className="mt-0.5 text-xs text-brand-500">
                        {ARTICLE_CATEGORY_LABELS[row.category] ?? row.category} · Güncelleme: {fmtDate(row.updated_at)}
                      </p>
                      {row.status === 'rejected' && row.admin_note && (
                        <p className="mt-1.5 rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
                          Admin notu: {row.admin_note}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>
                      <Button variant="outline" size="sm" onClick={() => startEdit(row.id)}>
                        Düzenle
                      </Button>
                      {row.status !== 'published' && (
                        <button
                          onClick={() => handleDelete(row)}
                          className="text-xs text-red-600 underline hover:text-red-800"
                        >
                          Sil
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ) : (
        <Card className="max-w-3xl space-y-5 p-6">
          {editingStatus === 'published' && (
            <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
              Bu yazı yayında — yapacağınız değişiklikler kaydettiğinizde onay beklemeden anında yayına yansır.
            </div>
          )}
          {editingStatus === 'rejected' && editingNote && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <strong>Admin notu:</strong> {editingNote}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-700">Başlık</label>
            <Input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-700">Slug</label>
            <Input
              value={form.slug}
              onChange={(e) => { setSlugTouched(true); set('slug', slugify(e.target.value)); }}
            />
            <p className="mt-1 text-xs text-brand-400">URL: /psikoloji-rehberi/{form.slug || '…'}</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-700">Kısa Açıklama</label>
            <Textarea value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} rows={2} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-700">İçerik (Markdown)</label>
            <div className="mb-1.5 rounded-lg border border-brand-100 bg-brand-50/50 px-3 py-2 text-xs text-brand-500">
              <code>## Alt başlık</code> · <code>- Liste</code> · <code>**Kalın**</code> ·{' '}
              <code>[Bağlantı](URL)</code>
            </div>
            <Textarea
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              rows={14}
              className="font-mono text-xs"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-700">Kategori</label>
            <Select value={form.category} onChange={(e) => set('category', e.target.value as ArticleCategory)}>
              {ARTICLE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{ARTICLE_CATEGORY_LABELS[cat]}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-brand-700">Kapak görseli</label>
            <div className="flex items-center gap-4">
              {form.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.cover_image_url} alt="Kapak" className="h-16 w-24 rounded-lg object-cover" />
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={coverUploading}
                onClick={() => coverInputRef.current?.click()}
              >
                {coverUploading ? 'Yükleniyor...' : form.cover_image_url ? 'Değiştir' : 'Görsel yükle'}
              </Button>
              <input
                ref={coverInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleCoverChange}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-700">
              İlgili uzmanlık (opsiyonel)
            </label>
            <Input
              value={form.related_specialty_slug}
              onChange={(e) => set('related_specialty_slug', e.target.value.trim())}
              placeholder="ör. cift-terapisi"
            />
            <p className="mt-1 text-xs text-brand-400">
              Doldurursanız yazının sonundaki &quot;uzmanlarla görüş&quot; butonu bu uzmanlık sayfasına gider.
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-3 border-t border-brand-100 pt-5">
            <Button variant="outline" onClick={backToList} disabled={saving}>
              Vazgeç
            </Button>
            <Button variant="outline" onClick={() => submit('save_draft')} disabled={saving}>
              Taslak Olarak Kaydet
            </Button>
            <Button onClick={() => submit('submit')} disabled={saving}>
              {editingStatus === 'published'
                ? 'Kaydet ve Yayınla'
                : saving
                  ? 'Gönderiliyor...'
                  : 'İncelemeye Gönder'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
