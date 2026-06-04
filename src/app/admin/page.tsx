'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ImageUpload from '@/components/admin/ImageUpload';

// ── Types ─────────────────────────────────────────────────────────────────────

type Specialty = { id: string; slug: string; name: string };

type Professional = {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  professional_type: string | null;
  city: string;
  district: string | null;
  clinic_name: string | null;
  address: string | null;
  google_maps_url: string | null;
  is_online: boolean;
  is_in_person: boolean;
  experience_years: number;
  about: string | null;
  price_range: string | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  instagram_url: string | null;
  image_url: string | null;
  rating: number;
  is_verified: boolean;
  is_featured: boolean;
  status: string | null;
  specialties: Specialty[];
};

type FormData = {
  name: string;
  slug: string;
  title: string;
  professional_type: string;
  city: string;
  district: string;
  clinic_name: string;
  address: string;
  google_maps_url: string;
  is_online: boolean;
  is_in_person: boolean;
  experience_years: string;
  about: string;
  price_range: string;
  phone: string;
  email: string;
  website_url: string;
  instagram_url: string;
  image_url: string;
  rating: string;
  is_verified: boolean;
  is_featured: boolean;
  status: string;
  specialtyIds: string[];
};

type Flash = { type: 'success' | 'error'; text: string };

// ── Constants ─────────────────────────────────────────────────────────────────

const PROFESSIONAL_TYPES = [
  { value: 'psychologist', label: 'Psikolog' },
  { value: 'clinical_psychologist', label: 'Klinik Psikolog' },
  { value: 'psychiatrist', label: 'Psikiyatrist' },
  { value: 'family_therapist', label: 'Aile Terapisti' },
  { value: 'counselor', label: 'Psikolojik Danışman' },
];

const SESSION_KEY = 'terapimap_admin_pw';

const EMPTY_FORM: FormData = {
  name: '',
  slug: '',
  title: '',
  professional_type: '',
  city: '',
  district: '',
  clinic_name: '',
  address: '',
  google_maps_url: '',
  is_online: false,
  is_in_person: true,
  experience_years: '0',
  about: '',
  price_range: '',
  phone: '',
  email: '',
  website_url: '',
  instagram_url: '',
  image_url: '',
  rating: '5.0',
  is_verified: false,
  is_featured: false,
  status: 'pending',
  specialtyIds: [],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  const map: Record<string, string> = {
    ğ: 'g', ü: 'u', ş: 's', ı: 'i', ö: 'o', ç: 'c',
    Ğ: 'g', Ü: 'u', Ş: 's', İ: 'i', Ö: 'o', Ç: 'c',
  };
  return text
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function profToForm(p: Professional): FormData {
  return {
    name: p.name ?? '',
    slug: p.slug ?? '',
    title: p.title ?? '',
    professional_type: p.professional_type ?? '',
    city: p.city ?? '',
    district: p.district ?? '',
    clinic_name: p.clinic_name ?? '',
    address: p.address ?? '',
    google_maps_url: p.google_maps_url ?? '',
    is_online: p.is_online ?? false,
    is_in_person: p.is_in_person ?? true,
    experience_years: String(p.experience_years ?? 0),
    about: p.about ?? '',
    price_range: p.price_range ?? '',
    phone: p.phone ?? '',
    email: p.email ?? '',
    website_url: p.website_url ?? '',
    instagram_url: p.instagram_url ?? '',
    image_url: p.image_url ?? '',
    rating: String(p.rating ?? 5),
    is_verified: p.is_verified ?? false,
    is_featured: p.is_featured ?? false,
    status: p.status ?? 'pending',
    specialtyIds: (p.specialties ?? []).map((s) => s.id),
  };
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Input({
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition ${className ?? ''}`}
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition resize-y"
    />
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-400"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold text-brand-700 uppercase tracking-wider border-b border-brand-100 pb-2 mb-4 mt-6 first:mt-0">
      {children}
    </h3>
  );
}

function Btn({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  className?: string;
}) {
  const base =
    'inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-gray-500 hover:text-gray-800 hover:bg-gray-100',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className ?? ''}`}
    >
      {children}
    </button>
  );
}

// ── Login View ────────────────────────────────────────────────────────────────

function LoginView({ onAuth }: { onAuth: (pw: string) => void }) {
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
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Terapimap Admin</h1>
          <p className="text-gray-500 text-sm mt-1">Devam etmek için şifrenizi girin</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Şifre</Label>
            <Input
              type="password"
              value={pw}
              onChange={setPw}
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
          <Btn type="submit" disabled={loading || !pw} className="w-full">
            {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
          </Btn>
        </form>
      </div>
    </div>
  );
}

// ── Professional List ─────────────────────────────────────────────────────────

function ProfessionalList({
  professionals,
  loading,
  onAdd,
  onEdit,
  onDelete,
}: {
  professionals: Professional[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = professionals.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.city?.toLowerCase().includes(search.toLowerCase()) ||
      p.professional_type?.toLowerCase().includes(search.toLowerCase()),
  );

  const typeLabel = (t: string | null) =>
    PROFESSIONAL_TYPES.find((x) => x.value === t)?.label ?? t ?? '—';

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Profesyoneller</h2>
          <p className="text-xs text-gray-500">{professionals.length} kayıt</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="İsim, şehir veya tür ara…"
            className="flex-1 sm:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <Btn onClick={onAdd}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Ekle
          </Btn>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">Yükleniyor…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            {search ? 'Sonuç bulunamadı.' : 'Henüz profesyonel eklenmemiş.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Ad</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Tür</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Şehir</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Puan</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Durum</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Uzmanlıklar</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-8 h-8 rounded-full object-cover bg-gray-100 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 text-brand-600 font-semibold text-xs">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{p.name}</div>
                          {p.title && (
                            <div className="text-xs text-gray-400">{p.title}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{typeLabel(p.professional_type)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.city}
                      {p.district ? ` / ${p.district}` : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        {p.rating ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.status === 'approved' && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-green-50 text-green-700 font-medium">✓ Approved</span>
                        )}
                        {p.status === 'featured' && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-yellow-50 text-yellow-700 font-medium">★ Featured</span>
                        )}
                        {p.status === 'pending' && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600 font-medium">Bekliyor</span>
                        )}
                        {p.status === 'rejected' && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-red-50 text-red-600 font-medium">Reddedildi</span>
                        )}
                        {p.is_online && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700 font-medium">Online</span>
                        )}
                        {p.is_in_person && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-green-50 text-green-700 font-medium">Yüz yüze</span>
                        )}
                        {p.is_verified && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-brand-50 text-brand-700 font-medium">✓ Doğrulandı</span>
                        )}
                        {p.is_featured && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-yellow-50 text-yellow-700 font-medium">★ Öne Çıkan</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(p.specialties ?? []).slice(0, 3).map((s) => (
                          <span key={s.id} className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                            {s.name}
                          </span>
                        ))}
                        {(p.specialties ?? []).length > 3 && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500">
                            +{(p.specialties ?? []).length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Btn variant="ghost" onClick={() => onEdit(p.id)} className="px-2 py-1.5">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Düzenle
                        </Btn>
                        <Btn
                          variant="ghost"
                          onClick={() => onDelete(p.id, p.name)}
                          className="px-2 py-1.5 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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
    </div>
  );
}

// ── Professional Form ─────────────────────────────────────────────────────────

function ProfessionalForm({
  editingId,
  professionals,
  specialties,
  onSave,
  onCancel,
  apiFetch,
  adminPassword,
}: {
  editingId: string | null;
  professionals: Professional[];
  specialties: Specialty[];
  onSave: (msg: string) => void;
  onCancel: () => void;
  apiFetch: (path: string, options?: RequestInit) => Promise<Response>;
  adminPassword: string;
}) {
  const existing = editingId ? professionals.find((p) => p.id === editingId) ?? null : null;
  const [form, setForm] = useState<FormData>(existing ? profToForm(existing) : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const autoSlugRef = useRef(!editingId); // only auto-generate slug when creating new

  const set = (field: keyof FormData) => (value: string | boolean | string[]) =>
    setForm((f) => ({ ...f, [field]: value }));

  // Auto-generate slug from name on new records
  const handleNameChange = (v: string) => {
    set('name')(v);
    if (autoSlugRef.current) {
      set('slug')(slugify(v));
    }
  };

  const handleSlugChange = (v: string) => {
    autoSlugRef.current = false;
    set('slug')(v);
  };

  const toggleSpecialty = (id: string) => {
    setForm((f) => ({
      ...f,
      specialtyIds: f.specialtyIds.includes(id)
        ? f.specialtyIds.filter((x) => x !== id)
        : [...f.specialtyIds, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) { setError('Ad zorunludur.'); return; }
    if (!form.slug.trim()) { setError('Slug zorunludur.'); return; }
    if (!form.city.trim()) { setError('Şehir zorunludur.'); return; }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        title: form.title || null,
        professional_type: form.professional_type || null,
        city: form.city.trim(),
        district: form.district || null,
        clinic_name: form.clinic_name || null,
        address: form.address || null,
        google_maps_url: form.google_maps_url || null,
        is_online: form.is_online,
        is_in_person: form.is_in_person,
        experience_years: parseInt(form.experience_years, 10) || 0,
        about: form.about || null,
        price_range: form.price_range || null,
        phone: form.phone || null,
        email: form.email || null,
        website_url: form.website_url || null,
        instagram_url: form.instagram_url || null,
        image_url: form.image_url || null,
        rating: parseFloat(form.rating) || 5.0,
        is_verified: form.is_verified,
        is_featured: form.is_featured,
        status: form.status,
        specialtyIds: form.specialtyIds,
      };

      const res = editingId
        ? await apiFetch(`/api/admin/professionals/${editingId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
          })
        : await apiFetch('/api/admin/professionals', {
            method: 'POST',
            body: JSON.stringify(payload),
          });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Bir hata oluştu.');
        return;
      }

      if (data.warning) {
        onSave(`Kaydedildi, ancak uyarı: ${data.warning}`);
      } else {
        onSave(editingId ? 'Profesyonel güncellendi.' : 'Profesyonel oluşturuldu.');
      }
    } catch (err) {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      {/* Error */}
      {error && (
        <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-0">

        {/* ── Identity ── */}
        <SectionHeading>Kimlik Bilgileri</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label required>Ad Soyad</Label>
            <Input value={form.name} onChange={handleNameChange} placeholder="Dr. Ayşe Kaya" required />
          </div>
          <div>
            <Label required>Slug</Label>
            <Input
              value={form.slug}
              onChange={handleSlugChange}
              placeholder="ayse-kaya"
              required
            />
            <p className="text-xs text-gray-400 mt-1">URL'de kullanılır. Benzersiz olmalı.</p>
          </div>
          <div>
            <Label>Ünvan</Label>
            <Input value={form.title} onChange={set('title')} placeholder="Dr., Uzm. Psk." />
          </div>
          <div>
            <Label>Profesyonel Türü</Label>
            <Select
              value={form.professional_type}
              onChange={set('professional_type')}
              options={PROFESSIONAL_TYPES}
              placeholder="Seçiniz…"
            />
          </div>
          <div>
            <Label>Deneyim (yıl)</Label>
            <Input type="number" value={form.experience_years} onChange={set('experience_years')} placeholder="5" />
          </div>
          <div>
            <Label>Puan</Label>
            <Input type="number" value={form.rating} onChange={set('rating')} placeholder="5.0" />
            <p className="text-xs text-gray-400 mt-1">0 – 5 arası</p>
          </div>
        </div>

        <div className="mt-4">
          <Label>Hakkında</Label>
          <Textarea
            value={form.about}
            onChange={set('about')}
            placeholder="Profesyonel hakkında kısa bilgi…"
            rows={5}
          />
        </div>

        <div className="mt-4">
          <Label>Ücret Aralığı</Label>
          <Input value={form.price_range} onChange={set('price_range')} placeholder="500-800 TL / seans" />
        </div>

        {/* ── Location ── */}
        <SectionHeading>Konum</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label required>Şehir</Label>
            <Input value={form.city} onChange={set('city')} placeholder="İstanbul" required />
          </div>
          <div>
            <Label>İlçe</Label>
            <Input value={form.district} onChange={set('district')} placeholder="Kadıköy" />
          </div>
          <div className="md:col-span-2">
            <Label>Adres</Label>
            <Input value={form.address} onChange={set('address')} placeholder="Tam adres" />
          </div>
          <div className="md:col-span-2">
            <Label>Google Maps URL</Label>
            <Input
              value={form.google_maps_url}
              onChange={set('google_maps_url')}
              placeholder="https://maps.google.com/…"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Klinik / Kurum Adı</Label>
            <Input value={form.clinic_name} onChange={set('clinic_name')} placeholder="Örn. Sağlık Merkezi, Terapi Kliniği…" />
          </div>
        </div>

        {/* ── Contact ── */}
        <SectionHeading>İletişim</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Telefon</Label>
            <Input value={form.phone} onChange={set('phone')} placeholder="+90 555 000 00 00" />
          </div>
          <div>
            <Label>E-posta</Label>
            <Input type="email" value={form.email} onChange={set('email')} placeholder="info@ornek.com" />
          </div>
          <div>
            <Label>Web Sitesi</Label>
            <Input value={form.website_url} onChange={set('website_url')} placeholder="https://…" />
          </div>
          <div>
            <Label>Instagram</Label>
            <Input value={form.instagram_url} onChange={set('instagram_url')} placeholder="https://instagram.com/…" />
          </div>
        </div>

        {/* ── Media ── */}
        <SectionHeading>Medya</SectionHeading>
        <div>
          <Label>Profil Fotoğrafı</Label>
          <ImageUpload
            currentUrl={form.image_url}
            onUploaded={(url) => set('image_url')(url)}
            adminPassword={adminPassword}
          />
        </div>

        {/* ── Settings ── */}
        <SectionHeading>Ayarlar</SectionHeading>
        <div className="mb-4">
          <Label required>Durum (Status)</Label>
          <Select
            value={form.status}
            onChange={set('status')}
            options={[
              { value: 'pending',  label: 'Bekliyor (pending)' },
              { value: 'approved', label: 'Onaylandı (approved) — public' },
              { value: 'featured', label: 'Öne Çıkan (featured) — public' },
              { value: 'rejected', label: 'Reddedildi (rejected)' },
            ]}
          />
          <p className="text-xs text-gray-400 mt-1">Sadece approved ve featured kayıtlar sitede görünür.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Checkbox checked={form.is_online} onChange={set('is_online') as (v: boolean) => void} label="Online görüşme" />
          <Checkbox checked={form.is_in_person} onChange={set('is_in_person') as (v: boolean) => void} label="Yüz yüze" />
          <Checkbox checked={form.is_verified} onChange={set('is_verified') as (v: boolean) => void} label="Doğrulandı (rozet)" />
          <Checkbox checked={form.is_featured} onChange={set('is_featured') as (v: boolean) => void} label="Öne çıkan" />
        </div>

        {/* ── Specialties ── */}
        <SectionHeading>Uzmanlık Alanları</SectionHeading>
        {specialties.length === 0 ? (
          <p className="text-sm text-gray-400">Uzmanlık alanı bulunamadı.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {specialties.map((s) => {
              const selected = form.specialtyIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSpecialty(s.id)}
                  className={`px-3 py-2 rounded-lg text-sm text-left transition-all border ${
                    selected
                      ? 'bg-brand-600 text-white border-brand-600 font-medium'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-brand-300 hover:bg-brand-50'
                  }`}
                >
                  {selected && <span className="mr-1">✓</span>}
                  {s.name}
                </button>
              );
            })}
          </div>
        )}
        {form.specialtyIds.length > 0 && (
          <p className="text-xs text-brand-600 mt-2">{form.specialtyIds.length} alan seçildi</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-between mt-5">
        <Btn variant="secondary" onClick={onCancel}>
          İptal
        </Btn>
        <Btn type="submit" disabled={saving}>
          {saving ? 'Kaydediliyor…' : editingId ? 'Değişiklikleri Kaydet' : 'Profesyonel Oluştur'}
        </Btn>
      </div>
    </form>
  );
}

// ── Root Admin Page ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const [adminPassword, setAdminPassword] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [flash, setFlash] = useState<Flash | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>();

  // Restore session on mount
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

  const loadData = useCallback(async () => {
    if (!adminPassword) return;
    setListLoading(true);
    try {
      const [profRes, specRes] = await Promise.all([
        apiFetch('/api/admin/professionals'),
        apiFetch('/api/admin/specialties'),
      ]);
      if (profRes.ok) setProfessionals(await profRes.json());
      if (specRes.ok) setSpecialties(await specRes.json());
    } finally {
      setListLoading(false);
    }
  }, [adminPassword, apiFetch]);

  useEffect(() => {
    if (adminPassword) loadData();
  }, [adminPassword, loadData]);

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAdminPassword(null);
    setProfessionals([]);
    setSpecialties([]);
    setView('list');
    setEditingId(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" adlı profesyoneli silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`)) return;
    const res = await apiFetch(`/api/admin/professionals/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showFlash({ type: 'success', text: `"${name}" başarıyla silindi.` });
      loadData();
    } else {
      const d = await res.json();
      showFlash({ type: 'error', text: d.error ?? 'Silme işlemi başarısız.' });
    }
  };

  // ── Not authenticated ──
  if (!adminPassword) {
    return <LoginView onAuth={setAdminPassword} />;
  }

  // ── Authenticated ──
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <span className="font-bold text-gray-800">Terapimap</span>
          <span className="text-gray-300 hidden sm:block">|</span>
          <span className="text-sm text-gray-500 hidden sm:block">Admin Paneli</span>
          {view === 'form' && (
            <>
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              <span className="text-sm text-gray-600 font-medium">
                {editingId ? 'Düzenle' : 'Yeni Profesyonel'}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {view === 'form' && (
            <Btn
              variant="ghost"
              onClick={() => { setView('list'); setEditingId(null); }}
              className="text-sm"
            >
              ← Listeye Dön
            </Btn>
          )}
          <a
            href="/admin/leads"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            Leads
          </a>
          <Btn variant="ghost" onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-600 hover:bg-red-50">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Çıkış
          </Btn>
        </div>
      </header>

      {/* Flash */}
      {flash && (
        <div
          className={`mx-6 mt-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between gap-3 ${
            flash.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <span>
            {flash.type === 'success' ? '✓ ' : '✕ '}
            {flash.text}
          </span>
          <button onClick={() => setFlash(null)} className="opacity-60 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      )}

      {/* Content */}
      <main className="p-6">
        {view === 'list' ? (
          <ProfessionalList
            professionals={professionals}
            loading={listLoading}
            onAdd={() => { setEditingId(null); setView('form'); setFlash(null); }}
            onEdit={(id) => { setEditingId(id); setView('form'); setFlash(null); }}
            onDelete={handleDelete}
          />
        ) : (
          <ProfessionalForm
            editingId={editingId}
            professionals={professionals}
            specialties={specialties}
            apiFetch={apiFetch}
            adminPassword={adminPassword ?? ''}
            onSave={(msg) => {
              setView('list');
              setEditingId(null);
              loadData();
              showFlash({ type: 'success', text: msg });
            }}
            onCancel={() => { setView('list'); setEditingId(null); }}
          />
        )}
      </main>
    </div>
  );
}
