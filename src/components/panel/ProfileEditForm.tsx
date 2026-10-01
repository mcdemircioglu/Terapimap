'use client';

import { useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { TherapistDocument } from '@/types/database';

type Professional = {
  id: string;
  name: string;
  city: string;
  title: string | null;
  district: string | null;
  clinic_name: string | null;
  address: string | null;
  google_maps_url: string | null;
  website_url: string | null;
  instagram_url: string | null;
  about: string | null;
  is_online: boolean;
  is_in_person: boolean;
  image_url: string | null;
  documents: TherapistDocument[];
};

type RequestRow = {
  id: string;
  status: string;
  created_at: string;
  admin_note: string | null;
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Bekliyor', cls: 'bg-yellow-50 text-yellow-700' },
  approved: { label: 'Onaylandı', cls: 'bg-green-50 text-green-700' },
  rejected: { label: 'Reddedildi', cls: 'bg-red-50 text-red-600' },
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function ProfileEditForm({
  professional,
  pendingRequest,
  recentRequests,
}: {
  professional: Professional;
  pendingRequest: { id: string; created_at: string } | null;
  recentRequests: RequestRow[];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: professional.title ?? '',
    district: professional.district ?? '',
    clinic_name: professional.clinic_name ?? '',
    address: professional.address ?? '',
    google_maps_url: professional.google_maps_url ?? '',
    website_url: professional.website_url ?? '',
    instagram_url: professional.instagram_url ?? '',
    about: professional.about ?? '',
    is_online: professional.is_online,
    is_in_person: professional.is_in_person,
    image_url: professional.image_url ?? '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Belgeler (Faz 1): moderasyon kuyruğunun tamamen DIŞINDA — yüklenir
  // yüklenmez profilde herkese açık gösterilir. Bu yüzden pendingRequest
  // (diğer alanları kilitleyen durum) buradaki fieldset'i etkilemez.
  const [documents, setDocuments] = useState<TherapistDocument[]>(professional.documents ?? []);
  const [docUploading, setDocUploading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [removingDocUrl, setRemovingDocUrl] = useState<string | null>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const disabled = !!pendingRequest || saving;

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setDocError(null);
    setDocUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/panel/upload-document', { method: 'POST', body: fd });
      const d = await res.json();
      if (!res.ok) {
        setDocError(d.error ?? 'Belge yüklenemedi.');
        return;
      }
      setDocuments((docs) => [...docs, d.document]);
    } catch {
      setDocError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setDocUploading(false);
    }
  };

  const handleDocumentRemove = async (url: string) => {
    setDocError(null);
    setRemovingDocUrl(url);
    try {
      const res = await fetch('/api/panel/remove-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const d = await res.json();
      if (!res.ok) {
        setDocError(d.error ?? 'Belge kaldırılamadı.');
        return;
      }
      setDocuments((docs) => docs.filter((doc) => doc.url !== url));
    } catch {
      setDocError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setRemovingDocUrl(null);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/panel/upload-photo', { method: 'POST', body: fd });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? 'Fotoğraf yüklenemedi.');
        return;
      }
      setForm((f) => ({ ...f, image_url: d.url }));
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const res = await fetch('/api/panel/profile-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? 'Talep gönderilemedi.');
        return;
      }
      setSuccess(true);
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {pendingRequest && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          {fmtDate(pendingRequest.created_at)} tarihinde gönderdiğiniz güncelleme talebi
          inceleniyor. Sonuçlanana kadar yeni bir talep gönderemezsiniz.
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Talebiniz gönderildi. Terapimap ekibi onayladığında profiliniz güncellenecek.
        </div>
      )}

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <fieldset disabled={disabled} className="space-y-5 disabled:opacity-60">
            {/* Photo */}
            <div>
              <label className="mb-2 block text-sm font-medium text-brand-700">
                Profil fotoğrafı
              </label>
              <div className="flex items-center gap-4">
                {form.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.image_url}
                    alt={professional.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-600">
                    {professional.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled || uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? 'Yükleniyor...' : 'Fotoğraf değiştir'}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-brand-700">Unvan</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Örn. Klinik Psikolog"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-brand-700">
                  İlçe ({professional.city})
                </label>
                <Input
                  value={form.district}
                  onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-brand-700">
                  Klinik / kurum adı
                </label>
                <Input
                  value={form.clinic_name}
                  onChange={(e) => setForm((f) => ({ ...f, clinic_name: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-brand-700">Adres</label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-brand-700">
                  Google Haritalar linki
                </label>
                <Input
                  value={form.google_maps_url}
                  onChange={(e) => setForm((f) => ({ ...f, google_maps_url: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-brand-700">
                  Web sitesi
                </label>
                <Input
                  value={form.website_url}
                  onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-brand-700">Instagram</label>
                <Input
                  value={form.instagram_url}
                  onChange={(e) => setForm((f) => ({ ...f, instagram_url: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-brand-700">Hakkında</label>
              <Textarea
                value={form.about}
                onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))}
                rows={5}
              />
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm text-brand-700">
                <input
                  type="checkbox"
                  checked={form.is_online}
                  onChange={(e) => setForm((f) => ({ ...f, is_online: e.target.checked }))}
                />
                Online görüşme sunuyorum
              </label>
              <label className="flex items-center gap-2 text-sm text-brand-700">
                <input
                  type="checkbox"
                  checked={form.is_in_person}
                  onChange={(e) => setForm((f) => ({ ...f, is_in_person: e.target.checked }))}
                />
                Yüz yüze görüşme sunuyorum
              </label>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={disabled}>
              {saving ? 'Gönderiliyor...' : 'Değişiklikleri gönder'}
            </Button>
          </fieldset>
        </form>
      </Card>

      {/* Belgeler — moderasyon kuyruğundan bağımsız: yüklenir yüklenmez
          profilinizde herkese açık gösterilir. Bekleyen bir güncelleme
          talebiniz olsa bile burası kullanılabilir. */}
      <Card className="p-6">
        <h2 className="text-sm font-semibold text-brand-800">Belgeler</h2>
        <p className="mt-1 text-xs text-brand-500">
          Diploma, sertifika veya ek fotoğraflarınızı yükleyin. Yüklediğiniz belgeler
          onay beklemeden hemen profilinizde görünür; istemediğiniz bir belgeyi
          dilediğiniz zaman kaldırabilirsiniz.
        </p>

        {documents.length > 0 && (
          <ul className="mt-4 space-y-2">
            {documents.map((doc) => (
              <li
                key={doc.url}
                className="flex items-center justify-between gap-3 rounded-lg border border-brand-100 bg-brand-50/40 px-3 py-2 text-sm"
              >
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 items-center gap-2 text-brand-700 hover:underline"
                >
                  <span>{doc.type === 'pdf' ? '📄' : '🖼️'}</span>
                  <span className="truncate">{doc.name}</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleDocumentRemove(doc.url)}
                  disabled={removingDocUrl === doc.url}
                  className="shrink-0 text-xs text-red-600 underline hover:text-red-800 disabled:opacity-50"
                >
                  {removingDocUrl === doc.url ? 'Kaldırılıyor...' : 'Kaldır'}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={docUploading}
            onClick={() => docFileInputRef.current?.click()}
          >
            {docUploading ? 'Yükleniyor...' : 'Belge yükle'}
          </Button>
          <input
            ref={docFileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleDocumentUpload}
          />
          <p className="mt-1.5 text-xs text-brand-400">PDF, JPG, PNG veya WebP · maksimum 10 MB</p>
        </div>

        {docError && <p className="mt-2 text-sm text-red-600">{docError}</p>}
      </Card>

      {recentRequests.length > 0 && (
        <Card className="p-6">
          <h2 className="mb-3 text-sm font-semibold text-brand-800">Talep geçmişi</h2>
          <div className="space-y-2">
            {recentRequests.map((r) => {
              const s = STATUS_LABELS[r.status] ?? { label: r.status, cls: 'bg-gray-100 text-gray-600' };
              return (
                <div key={r.id} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <span className="text-brand-600">{fmtDate(r.created_at)}</span>
                    {r.admin_note && (
                      <p className="mt-0.5 text-xs text-brand-400">{r.admin_note}</p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
