'use client';

/**
 * /panel/duyurular — "Duyurularım" (etkinlik / eğitim / iş ilanı).
 *
 * Blog panel sayfasıyla (/panel/blog) aynı draft → pending → published /
 * rejected akışı: terapist yalnızca draft/pending'e geçebilir, published
 * yalnızca admin onayıyla set edilir (bkz. /api/panel/announcements route
 * yorumları). Randevu takvimiyle aynı paket şartı: "Duyuru Aç" yalnızca
 * booking_tier='full' olan terapistlerde aktif — bu kısıt hem burada
 * (UI) hem sunucuda (POST/PUT) uygulanıyor.
 *
 * Blog'tan farkı: "Kayıt Ol" formundan gelen başvurular admin onayı
 * olmadan doğrudan burada, her duyurunun altında listelenir (leads'ten
 * farklı — moderasyon yok).
 */
import { useState, useEffect, useCallback } from 'react';
import { useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ANNOUNCEMENT_TYPES, ANNOUNCEMENT_TYPE_LABELS } from '@/types/database';
import type { AnnouncementType, AnnouncementStatus } from '@/types/database';

type AnnouncementRow = {
  id: string;
  type: AnnouncementType;
  title: string;
  description: string;
  location_text: string | null;
  is_online: boolean;
  time_label: string | null;
  capacity: number | null;
  price_info: string | null;
  image_url: string | null;
  status: AnnouncementStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

type RegistrationRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  created_at: string;
};

type FormState = {
  type: AnnouncementType;
  title: string;
  description: string;
  location_text: string;
  time_label: string;
  capacity: string;
  price_info: string;
  is_online: boolean;
  image_url: string;
};

const EMPTY_FORM: FormState = {
  type: 'etkinlik',
  title: '',
  description: '',
  location_text: '',
  time_label: '',
  capacity: '',
  price_info: '',
  is_online: false,
  image_url: '',
};

function fmtDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtDateTime(value: string): string {
  return new Date(value).toLocaleDateString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_LABELS: Record<AnnouncementStatus, { label: string; cls: string }> = {
  draft: { label: 'Taslak', cls: 'bg-gray-100 text-gray-600' },
  pending: { label: 'İncelemede', cls: 'bg-yellow-50 text-yellow-700' },
  published: { label: 'Yayında', cls: 'bg-green-50 text-green-700' },
  rejected: { label: 'Reddedildi', cls: 'bg-red-50 text-red-600' },
};

export default function PanelAnnouncementsPage() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [bookingTier, setBookingTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<AnnouncementStatus | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [openRegistrationsId, setOpenRegistrationsId] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<Record<string, RegistrationRow[]>>({});
  const [registrationsLoading, setRegistrationsLoading] = useState<string | null>(null);

  const isFullTier = bookingTier === 'full';

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/panel/announcements');
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAnnouncements(data.announcements ?? []);
        setBookingTier(data.booking_tier ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const startNew = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setEditingStatus(null);
    setEditingNote(null);
    setError(null);
    setView('form');
  };

  const startEdit = async (id: string) => {
    setError(null);
    const res = await fetch(`/api/panel/announcements/${id}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setFlash(data.error ?? 'Duyuru yüklenemedi.');
      return;
    }
    const a = data.announcement;
    setForm({
      type: a.type ?? 'etkinlik',
      title: a.title ?? '',
      description: a.description ?? '',
      location_text: a.location_text ?? '',
      time_label: a.time_label ?? '',
      capacity: a.capacity != null ? String(a.capacity) : '',
      price_info: a.price_info ?? '',
      is_online: Boolean(a.is_online),
      image_url: a.image_url ?? '',
    });
    setEditingId(id);
    setEditingStatus(a.status);
    setEditingNote(a.admin_note ?? null);
    setView('form');
  };

  const backToList = () => {
    setView('list');
    loadAnnouncements();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImageUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/panel/upload-announcement-image', { method: 'POST', body: fd });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? 'Görsel yüklenemedi.');
        return;
      }
      set('image_url', d.url);
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setImageUploading(false);
    }
  };

  const submit = async (action: 'save_draft' | 'submit') => {
    setError(null);
    if (!form.title.trim()) return setError('Başlık zorunludur.');
    if (!form.description.trim() || form.description.trim().length < 10) {
      return setError('Açıklama zorunludur (en az 10 karakter).');
    }
    if (form.capacity && (!Number.isInteger(Number(form.capacity)) || Number(form.capacity) <= 0)) {
      return setError('Kontenjan pozitif bir tam sayı olmalı.');
    }

    setSaving(true);
    try {
      const payload = { ...form, action };
      const res = editingId
        ? await fetch(`/api/panel/announcements/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/panel/announcements', {
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
            ? 'Duyuru incelemeye gönderildi.'
            : 'Taslak kaydedildi.',
      );
      backToList();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: AnnouncementRow) => {
    if (row.status === 'published') return;
    if (!window.confirm(`"${row.title}" taslağını silmek istediğinizden emin misiniz?`)) return;
    const res = await fetch(`/api/panel/announcements/${row.id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setFlash(data.error ?? 'Silinemedi.');
      return;
    }
    setFlash('Taslak silindi.');
    loadAnnouncements();
  };

  const toggleRegistrations = async (id: string) => {
    if (openRegistrationsId === id) {
      setOpenRegistrationsId(null);
      return;
    }
    setOpenRegistrationsId(id);
    if (!registrations[id]) {
      setRegistrationsLoading(id);
      try {
        const res = await fetch(`/api/panel/announcements/${id}/registrations`);
        const data = await res.json().catch(() => ({}));
        if (res.ok) setRegistrations((prev) => ({ ...prev, [id]: data.registrations ?? [] }));
      } finally {
        setRegistrationsLoading(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-brand-900">Duyurularım</h1>
          <p className="text-sm text-brand-500">
            Etkinlik, eğitim veya iş ilanı duyurularınız admin onayından sonra /duyurular sayfasında yayınlanır.
          </p>
        </div>
        {view === 'list' && isFullTier && <Button onClick={startNew}>+ Duyuru Aç</Button>}
      </div>

      {!loading && !isFullTier && (
        <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          Duyuru oluşturma (etkinlik, eğitim, iş ilanı) <strong>Tam Paket</strong>&apos;e dahildir. Erişim
          açmak için Terapimap ekibiyle iletişime geçin.
        </div>
      )}

      {flash && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {flash}
        </div>
      )}

      {view === 'list' ? (
        <Card className="p-0 overflow-hidden">
          {loading ? (
            <p className="p-6 text-sm text-brand-500">Yükleniyor...</p>
          ) : announcements.length === 0 ? (
            <p className="p-6 text-sm text-brand-500">
              {isFullTier
                ? 'Henüz bir duyurunuz yok. "+ Duyuru Aç" ile ilk duyurunuzu oluşturun.'
                : 'Henüz bir duyurunuz yok.'}
            </p>
          ) : (
            <div className="divide-y divide-brand-100">
              {announcements.map((row) => (
                <div key={row.id} className="p-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-brand-900">{row.title}</p>
                      <p className="mt-0.5 text-xs text-brand-500">
                        {ANNOUNCEMENT_TYPE_LABELS[row.type]} · Güncelleme: {fmtDate(row.updated_at)}
                      </p>
                      {row.status === 'rejected' && row.admin_note && (
                        <p className="mt-1.5 rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
                          Admin notu: {row.admin_note}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_LABELS[row.status].cls}`}>
                        {STATUS_LABELS[row.status].label}
                      </span>
                      {isFullTier && (
                        <Button variant="outline" size="sm" onClick={() => startEdit(row.id)}>
                          Düzenle
                        </Button>
                      )}
                      {row.status !== 'published' && isFullTier && (
                        <button
                          onClick={() => handleDelete(row)}
                          className="text-xs text-red-600 underline hover:text-red-800"
                        >
                          Sil
                        </button>
                      )}
                    </div>
                  </div>

                  {row.status === 'published' && (
                    <div className="mt-2">
                      <button
                        onClick={() => toggleRegistrations(row.id)}
                        className="text-xs font-medium text-brand-600 underline hover:text-brand-800"
                      >
                        {openRegistrationsId === row.id ? 'Kayıtları gizle' : 'Kayıtları gör'}
                        {registrations[row.id] ? ` (${registrations[row.id].length})` : ''}
                      </button>

                      {openRegistrationsId === row.id && (
                        <div className="mt-2 rounded-lg border border-brand-100 bg-brand-50/40 p-3">
                          {registrationsLoading === row.id ? (
                            <p className="text-xs text-brand-500">Yükleniyor...</p>
                          ) : !registrations[row.id] || registrations[row.id].length === 0 ? (
                            <p className="text-xs text-brand-500">Henüz kayıt yok.</p>
                          ) : (
                            <div className="space-y-2">
                              {registrations[row.id].map((reg) => (
                                <div key={reg.id} className="rounded-md bg-white px-3 py-2 text-xs shadow-sm">
                                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <span className="font-medium text-brand-900">{reg.name}</span>
                                    <span className="text-brand-400">{fmtDateTime(reg.created_at)}</span>
                                  </div>
                                  <p className="mt-0.5 text-brand-600">
                                    {reg.email}
                                    {reg.phone ? ` · ${reg.phone}` : ''}
                                  </p>
                                  {reg.message && <p className="mt-1 text-brand-700">{reg.message}</p>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <Card className="max-w-3xl space-y-5 p-6">
          {editingStatus === 'published' && (
            <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
              Bu duyuru yayında — yapacağınız değişiklikler kaydettiğinizde onay beklemeden anında yayına yansır.
            </div>
          )}
          {editingStatus === 'rejected' && editingNote && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <strong>Admin notu:</strong> {editingNote}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-700">Duyuru Türü</label>
            <Select value={form.type} onChange={(e) => set('type', e.target.value as AnnouncementType)}>
              {ANNOUNCEMENT_TYPES.map((t) => (
                <option key={t} value={t}>{ANNOUNCEMENT_TYPE_LABELS[t]}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-700">Başlık</label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-brand-700">Açıklama</label>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={6} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-700">Yer</label>
              <Input
                value={form.location_text}
                onChange={(e) => set('location_text', e.target.value)}
                placeholder="ör. İstanbul, Kadıköy"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-700">Zaman</label>
              <Input
                value={form.time_label}
                onChange={(e) => set('time_label', e.target.value)}
                placeholder="ör. Her Cumartesi 14:00"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-700">Kontenjan (opsiyonel)</label>
              <Input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => set('capacity', e.target.value)}
                placeholder="ör. 20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-brand-700">Fiyat (opsiyonel)</label>
              <Input
                value={form.price_info}
                onChange={(e) => set('price_info', e.target.value)}
                placeholder="ör. 500 TL / Ücretsiz"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-brand-700">
            <input
              type="checkbox"
              checked={form.is_online}
              onChange={(e) => set('is_online', e.target.checked)}
            />
            Online gerçekleşecek
          </label>

          <div>
            <label className="mb-2 block text-sm font-medium text-brand-700">Görsel (opsiyonel)</label>
            <div className="flex items-center gap-4">
              {form.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image_url} alt="Duyuru görseli" className="h-16 w-24 rounded-lg object-cover" />
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={imageUploading}
                onClick={() => imageInputRef.current?.click()}
              >
                {imageUploading ? 'Yükleniyor...' : form.image_url ? 'Değiştir' : 'Görsel yükle'}
              </Button>
              <input
                ref={imageInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>
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
