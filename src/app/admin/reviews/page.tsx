'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

type ReviewStatus = 'pending' | 'approved' | 'rejected';

type Review = {
  id: string;
  professional_id: string;
  professional_name: string | null;
  professional_slug: string | null;
  reviewer_name: string;
  reviewer_email: string;
  is_anonymous: boolean;
  rating: number;
  comment: string;
  is_verified: boolean;
  status: ReviewStatus;
  admin_note: string | null;
  created_at: string;
};

type Flash = { type: 'success' | 'error'; text: string };

// ── Constants ─────────────────────────────────────────────────────────────────

const SESSION_KEY = 'terapimap_admin_pw';

const STATUS_META: Record<ReviewStatus, { label: string; className: string }> = {
  pending:  { label: 'Bekliyor',  className: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  approved: { label: 'Onaylandı', className: 'bg-green-50 text-green-700 border border-green-200' },
  rejected: { label: 'Reddedildi', className: 'bg-red-50 text-red-600 border border-red-200' },
};

const FILTER_OPTIONS: { value: '' | ReviewStatus; label: string }[] = [
  { value: '',          label: 'Tümü' },
  { value: 'pending',   label: 'Bekliyor' },
  { value: 'approved',  label: 'Onaylandı' },
  { value: 'rejected',  label: 'Reddedildi' },
];

// ── Shared UI primitives (matches admin/leads style) ──────────────────────────

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

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400" aria-label={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} viewBox="0 0 20 20" fill="currentColor" className={`h-3.5 w-3.5 ${s > rating ? 'text-gray-200' : ''}`}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.446a1 1 0 00-.363 1.118l1.287 3.957c.3.921-.755 1.688-1.538 1.118l-3.367-2.446a1 1 0 00-1.176 0l-3.367 2.446c-.783.57-1.838-.197-1.538-1.118l1.287-3.957a1 1 0 00-.363-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
        </svg>
      ))}
    </span>
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

export default function ReviewsAdminPage() {
  const [adminPassword, setAdminPassword] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'' | ReviewStatus>('pending');
  const [flash, setFlash] = useState<Flash | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
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

  const loadReviews = useCallback(async () => {
    if (!adminPassword) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/reviews');
      if (res.ok) setReviews(await res.json());
    } finally {
      setLoading(false);
    }
  }, [adminPassword, apiFetch]);

  useEffect(() => {
    if (adminPassword) loadReviews();
  }, [adminPassword, loadReviews]);

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAdminPassword(null);
    setReviews([]);
  };

  const doAction = async (id: string, action: 'approve' | 'reject') => {
    setActionId(id);
    try {
      const res = await apiFetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: action === 'approve' ? 'approved' : 'rejected' } : r)),
        );
        showFlash({
          type: 'success',
          text: action === 'approve' ? 'Değerlendirme onaylandı ve profilde yayınlandı.' : 'Değerlendirme reddedildi.',
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

  const handleDelete = async (review: Review) => {
    if (!window.confirm(`"${review.reviewer_name}" adlı değerlendirmeyi kalıcı olarak silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.`)) return;
    setActionId(review.id);
    try {
      const res = await apiFetch(`/api/admin/reviews/${review.id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        setReviews((prev) => prev.filter((r) => r.id !== review.id));
        showFlash({ type: 'success', text: 'Değerlendirme silindi.' });
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

  const filtered = statusFilter ? reviews.filter((r) => r.status === statusFilter) : reviews;

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
          <span className="text-sm text-gray-600 font-medium hidden sm:block">Değerlendirmeler</span>
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
            <h2 className="text-lg font-bold text-gray-800">Değerlendirmeler</h2>
            <p className="text-xs text-gray-500">
              {filtered.length} / {reviews.length} kayıt
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
                  <span className="ml-1 opacity-70">({reviews.length})</span>
                ) : (
                  <span className="ml-1 opacity-70">
                    ({reviews.filter((r) => r.status === opt.value).length})
                  </span>
                )}
              </button>
            ))}
            <Btn variant="secondary" onClick={loadReviews} disabled={loading}>
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
              {statusFilter ? 'Bu durumda değerlendirme bulunamadı.' : 'Henüz değerlendirme gönderilmemiş.'}
            </div>
          ) : (
            filtered.map((review) => (
              <div key={review.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 text-sm">
                        {review.reviewer_name}
                        {review.is_anonymous && <span className="text-gray-400 font-normal"> (anonim paylaşım istedi)</span>}
                      </span>
                      {review.is_verified && (
                        <span className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full border border-brand-200 text-[11px] font-medium">
                          ✓ Doğrulanmış Danışan
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_META[review.status].className}`}>
                        {STATUS_META[review.status].label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {review.reviewer_email} · {' '}
                      {review.professional_slug ? (
                        <a
                          href={`/tr/psikolog/${review.professional_slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-600 hover:underline"
                        >
                          {review.professional_name}
                        </a>
                      ) : (
                        review.professional_name ?? '—'
                      )}
                    </p>
                    <div className="mt-2">
                      <Stars rating={review.rating} />
                    </div>
                    <p className="mt-2 text-sm text-gray-700 whitespace-pre-line max-w-2xl">{review.comment}</p>
                    <p className="text-[11px] text-gray-400 mt-2">
                      {new Date(review.created_at).toLocaleDateString('tr-TR', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {review.status === 'pending' && (
                      <div className="flex gap-2">
                        <Btn
                          onClick={() => doAction(review.id, 'approve')}
                          disabled={actionId === review.id}
                          className="text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700"
                        >
                          ✓ Onayla
                        </Btn>
                        <Btn
                          variant="secondary"
                          onClick={() => doAction(review.id, 'reject')}
                          disabled={actionId === review.id}
                          className="text-xs px-3 py-1.5 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          ✕ Reddet
                        </Btn>
                      </div>
                    )}
                    <Btn
                      variant="ghost"
                      onClick={() => handleDelete(review)}
                      disabled={actionId === review.id}
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
