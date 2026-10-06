'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

type AnnouncementType = 'etkinlik' | 'egitim' | 'is_ilani';
type AnnouncementStatus = 'draft' | 'pending' | 'published' | 'rejected';

const TYPE_LABELS: Record<AnnouncementType, string> = {
  etkinlik: 'Etkinlik',
  egitim: 'Eğitim',
  is_ilani: 'İş İlanı',
};

type Announcement = {
  id: string;
  professional_id: string;
  professional_name: string | null;
  professional_slug: string | null;
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
};

type Flash = { type: 'success' | 'error'; text: string };

// ── Constants ─────────────────────────────────────────────────────────────────

const SESSION_KEY = 'terapimap_admin_pw';

const STATUS_META: Record<AnnouncementStatus, { label: string; className: string }> = {
  draft:     { label: 'Taslak',     className: 'bg-gray-50 text-gray-500 border border-gray-200' },
  pending:   { label: 'Bekliyor',   className: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  published: { label: 'Yayında',    className: 'bg-green-50 text-green-700 border border-green-200' },
  rejected:  { label: 'Reddedildi', className: 'bg-red-50 text-red-600 border border-red-200' },
};

const FILTER_OPTIONS: { value: '' | AnnouncementStatus; label: string }[] = [
  { value: '',          label: 'Tümü' },
  { value: 'pending',   label: 'Bekliyor' },
  { value: 'published', label: 'Yayında' },
  { value: 'rejected',  label: 'Reddedildi' },
  { value: 'draft',     label: 'Taslak' },
];

// ── Shared UI primitives (reviews admin sayfasıyla aynı desen) ────────────────

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

export default function AnnouncementsAdminPage() {
  const [adminPassword, setAdminPassword] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'' | AnnouncementStatus>('pending');
  const [flash, setFlash] = useState<Flash | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
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

  const loadAnnouncements = useCallback(async () => {
    if (!adminPassword) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/announcements');
      if (res.ok) setAnnouncements(await res.json());
    } finally {
      setLoading(false);
    }
  }, [adminPassword, apiFetch]);

  useEffect(() => {
    if (adminPassword) loadAnnouncements();
  }, [adminPassword, loadAnnouncements]);

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAdminPassword(null);
    setAnnouncements([]);
  };

  const doAction = async (id: string, action: 'approve' | 'reject', admin_note?: string) => {
    setActionId(id);
    try {
      const res = await apiFetch(`/api/admin/announcements/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, admin_note }),
      });
      if (res.ok) {
        setAnnouncements((prev) =>
          prev.map((a) =>
            a.id === id
              ? { ...a, status: action === 'approve' ? 'published' : 'rejected', admin_note: admin_note ?? a.admin_note }
              : a,
          ),
        );
        showFlash({
          type: 'success',
          text: action === 'approve' ? 'Duyuru onaylandı ve /duyurular sayfasında yayınlandı.' : 'Duyuru reddedildi.',
        });
      } else {
        const d = await res.json();
        showFlash({ type: 'error', text: d.error ?? 'İşlem başarısız.' });
      }
    } catch {
      showFlash({ type: 'error', text: 'Bağlantı hatası. Lütfen tekrar deneyin.' });
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (announcement: Announcement) => {
    if (!window.confirm(`"${announcement.title}" adlı duyuruyu kalıcı olarak silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`)) return;
    setActionId(announcement.id);
    try {
      const res = await apiFetch(`/api/admin/announcements/${announcement.id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== announcement.id));
        showFlash({ type: 'success', text: 'Duyuru silindi.' });
      } else {
        const d = await res.json();
        showFlash({ type: 'error', text: d.error ?? 'Silme işlemi başarısız.' });
      }
    } catch {
      showFlash({ type: 'error', text: 'Bağlantı hatası. Lütfen tekrar deneyin.' });
    } finally {
      setActionId(null);
    }
  };

  if (!adminPassword) {
    return <LoginView onAuth={setAdminPassword} />;
  }

  const filtered = statusFilter ? announcements.filter((a) => a.status === statusFilter) : announcements;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111c.09.217.291.364.521.38l5.518.441c.598.048.84.795.38 1.185l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0l-4.725 2.885a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557l-4.204-3.602a.562.562 0 01.38-1.185l5.518-.441a.563.563 0 00.52-.38l2.126-5.111z" />
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
          <span className="text-sm text-gray-600 font-medium hidden sm:block">Duyurular</span>
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
            <h2 className="text-lg font-bold text-gray-800">Duyurular</h2>
            <p className="text-xs text-gray-500">
              {filtered.length} / {announcements.length} kayıt
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
                  <span className="ml-1 opacity-70">({announcements.length})</span>
                ) : (
                  <span className="ml-1 opacity-70">
                    ({announcements.filter((a) => a.status === opt.value).length})
                  </span>
                )}
              </button>
            ))}
            <Btn variant="secondary" onClick={loadAnnouncements} disabled={loading}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Yenile
            </Btn>
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 py-20 text-center text-gray-400 text-sm">Yükleniyor…</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 py-20 text-center text-gray-400 text-sm">
              {statusFilter ? 'Bu durumda duyuru bulunamadı.' : 'Henüz duyuru gönderilmemiş.'}
            </div>
          ) : (
            filtered.map((a) => (
              <div key={a.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex gap-4">
                    {a.image_url && (
                      <img
                        src={a.image_url}
                        alt=""
                        className="w-20 h-20 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full border border-brand-200 text-[11px] font-medium">
                          {TYPE_LABELS[a.type]}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_META[a.status].className}`}>
                          {STATUS_META[a.status].label}
                        </span>
                        {a.is_online && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200 text-[11px] font-medium">
                            Online
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-gray-900 text-sm mt-1">{a.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {a.professional_slug ? (
                          <a
                            href={`/tr/psikolog/${a.professional_slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-600 hover:underline"
                          >
                            {a.professional_name}
                          </a>
                        ) : (
                          a.professional_name ?? '—'
                        )}
                      </p>
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-line max-w-2xl">{a.description}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        {a.location_text && <span>📍 {a.location_text}</span>}
                        {a.time_label && <span>🕐 {a.time_label}</span>}
                        {a.capacity != null && <span>👥 Kontenjan: {a.capacity}</span>}
                        {a.price_info && <span>💳 {a.price_info}</span>}
                      </div>
                      {a.admin_note && (
                        <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-2 py-1 inline-block">
                          Not: {a.admin_note}
                        </p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-2">
                        {new Date(a.created_at).toLocaleDateString('tr-TR', {
                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {a.status === 'pending' && (
                      <div className="flex gap-2">
                        <Btn
                          onClick={() => doAction(a.id, 'approve')}
                          disabled={actionId === a.id}
                          className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700"
                        >
                          ✓ Onayla
                        </Btn>
                        <Btn
                          variant="secondary"
                          onClick={() => {
                            const note = window.prompt('Red nedeni (terapiste gösterilecek):', noteDrafts[a.id] ?? '');
                            if (note === null) return;
                            setNoteDrafts((prev) => ({ ...prev, [a.id]: note }));
                            doAction(a.id, 'reject', note);
                          }}
                          disabled={actionId === a.id}
                          className="text-xs px-3 py-1.5 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          ✕ Reddet
                        </Btn>
                      </div>
                    )}
                    <Btn
                      variant="ghost"
                      onClick={() => handleDelete(a)}
                      disabled={actionId === a.id}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 text-xs"
                    >
                      Sil
                    </Btn>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
