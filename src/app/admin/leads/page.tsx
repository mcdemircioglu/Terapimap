'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

type LeadStatus = 'new' | 'reviewed' | 'contacted' | 'spam';

type Lead = {
  id: string;
  professional_id: string;
  professional_name: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  source: string | null;
  status: LeadStatus;
  created_at: string;
};

type Flash = { type: 'success' | 'error'; text: string };

// ── Constants ─────────────────────────────────────────────────────────────────

const SESSION_KEY = 'terapimap_admin_pw';

const STATUS_META: Record<LeadStatus, { label: string; className: string }> = {
  new:       { label: 'Yeni',             className: 'bg-blue-50 text-blue-700 border border-blue-200' },
  reviewed:  { label: 'İncelendi',        className: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  contacted: { label: 'İletişim Kuruldu', className: 'bg-green-50 text-green-700 border border-green-200' },
  spam:      { label: 'Spam',             className: 'bg-red-50 text-red-700 border border-red-200' },
};

const FILTER_OPTIONS: { value: '' | LeadStatus; label: string }[] = [
  { value: '',          label: 'Tümü' },
  { value: 'new',       label: 'Yeni' },
  { value: 'reviewed',  label: 'İncelendi' },
  { value: 'contacted', label: 'İletişim Kuruldu' },
  { value: 'spam',      label: 'Spam' },
];

// ── Shared UI primitives (matches admin/page.tsx style) ───────────────────────

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
    primary:   'bg-brand-600 text-white hover:bg-brand-700',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    danger:    'bg-red-600 text-white hover:bg-red-700',
    ghost:     'text-gray-500 hover:text-gray-800 hover:bg-gray-100',
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
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Şifre</label>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition"
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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [adminPassword, setAdminPassword] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'' | LeadStatus>('');
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

  const loadLeads = useCallback(async () => {
    if (!adminPassword) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/leads');
      if (res.ok) setLeads(await res.json());
    } finally {
      setLoading(false);
    }
  }, [adminPassword, apiFetch]);

  useEffect(() => {
    if (adminPassword) loadLeads();
  }, [adminPassword, loadLeads]);

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAdminPassword(null);
    setLeads([]);
  };

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    const res = await apiFetch(`/api/admin/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    } else {
      const d = await res.json();
      showFlash({ type: 'error', text: d.error ?? 'Durum güncellenemedi.' });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" adlı lead'i silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`)) return;
    const res = await apiFetch(`/api/admin/leads/${id}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) {
      setLeads((prev) => prev.filter((l) => l.id !== id));
      showFlash({ type: 'success', text: `"${name}" başarıyla silindi.` });
    } else {
      const d = await res.json();
      showFlash({ type: 'error', text: d.error ?? 'Silme işlemi başarısız.' });
    }
  };

  if (!adminPassword) {
    return <LoginView onAuth={setAdminPassword} />;
  }

  const filtered = statusFilter
    ? leads.filter((l) => l.status === statusFilter)
    : leads;

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
          <a href="/admin" className="text-sm text-gray-500 hidden sm:block hover:text-brand-600 transition-colors">
            Admin Paneli
          </a>
          <svg className="w-4 h-4 text-gray-300 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm text-gray-600 font-medium hidden sm:block">Leads</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/admin"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
          >
            Profesyoneller
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
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Leads</h2>
            <p className="text-xs text-gray-500">
              {filtered.length} / {leads.length} kayıt
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  statusFilter === opt.value
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-brand-400 hover:text-brand-600'
                }`}
              >
                {opt.label}
                {opt.value === '' ? (
                  <span className="ml-1 opacity-70">({leads.length})</span>
                ) : (
                  <span className="ml-1 opacity-70">
                    ({leads.filter((l) => l.status === opt.value).length})
                  </span>
                )}
              </button>
            ))}
            <Btn variant="secondary" onClick={loadLeads} disabled={loading}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Yenile
            </Btn>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-20 text-center text-gray-400 text-sm">Yükleniyor…</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-sm">
              {statusFilter ? 'Bu durumda lead bulunamadı.' : 'Henüz lead gönderilmemiş.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Terapist</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Ad Soyad</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">E-posta</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Telefon</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Mesaj</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Kaynak</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Durum</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Tarih</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-800 font-medium whitespace-nowrap">
                        {lead.professional_name ?? <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-800 whitespace-nowrap">{lead.name}</td>
                      <td className="px-4 py-3">
                        <a href={`mailto:${lead.email}`} className="text-brand-600 hover:underline whitespace-nowrap">
                          {lead.email}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {lead.phone ?? <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs">
                        <p className="truncate" title={lead.message}>{lead.message}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {lead.source ?? <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                          className={`text-xs font-medium px-2 py-1 rounded-lg border-0 outline-none cursor-pointer ${STATUS_META[lead.status]?.className ?? ''}`}
                        >
                          {(Object.entries(STATUS_META) as [LeadStatus, { label: string; className: string }][]).map(([val, { label }]) => (
                            <option key={val} value={val}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(lead.created_at).toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Btn
                          variant="ghost"
                          onClick={() => handleDelete(lead.id, lead.name)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
