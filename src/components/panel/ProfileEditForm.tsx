'use client';

import { useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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

  const disabled = !!pendingRequest || saving;

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
