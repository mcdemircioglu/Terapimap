'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type VerificationRequest = {
  id: string;
  professional_id: string | null;
  request_type: 'update' | 'photo_update' | 'removal';
  full_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  admin_note: string | null;
};

const SESSION_KEY = 'terapimap_admin_pw';

const REQUEST_TYPE_LABELS: Record<string, string> = {
  update: 'Profil güncelleme',
  photo_update: 'Fotoğraf güncelleme',
  removal: 'Profil kaldırma',
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  pending:           { label: 'Bekliyor',        cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  approved:          { label: 'Onaylandı',        cls: 'bg-green-50 text-green-700 border-green-200' },
  rejected:          { label: 'Reddedildi',       cls: 'bg-red-50 text-red-600 border-red-200' },
  removal_requested: { label: 'Kaldırma Talebi',  cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  removed:           { label: 'Kaldırıldı',       cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

function statusBadge(status: string) {
  const s = STATUS_LABELS[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600 border-gray-200' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${s.cls}`}>
      {s.label}
    </span>
  );
}

export default function VerificationRequestsPage() {
  const [password, setPassword] = useState<string | null>(null);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [pw, setPw] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) setPassword(stored);
  }, []);

  const apiFetch = useCallback(
    (path: string, options: RequestInit = {}) =>
      fetch(path, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password ?? '',
          ...((options.headers as Record<string, string>) ?? {}),
        },
      }),
    [password],
  );

  const loadRequests = useCallback(async () => {
    if (!password) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/admin/verification-requests?status=${statusFilter}`);
      if (res.ok) setRequests(await res.json());
    } finally {
      setLoading(false);
    }
  }, [password, statusFilter, apiFetch]);

  useEffect(() => {
    if (password) loadRequests();
  }, [password, loadRequests]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (data.ok) {
        sessionStorage.setItem(SESSION_KEY, pw);
        setPassword(pw);
      } else {
        setLoginError('Hatalı şifre.');
      }
    } catch {
      setLoginError('Bağlantı hatası.');
    } finally {
      setLoginLoading(false);
    }
  };

  if (!password) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm border border-gray-100">
          <h1 className="text-xl font-bold text-gray-900 mb-6 text-center">Terapimap Admin</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Şifre"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            {loginError && <p className="text-red-600 text-sm">{loginError}</p>}
            <button
              type="submit"
              disabled={loginLoading || !pw}
              className="w-full bg-brand-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
            >
              {loginLoading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="font-bold text-gray-800">Terapimap</span>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-500">Doğrulama Talepleri</span>
          {pending > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
              {pending}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a href="/admin" className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
            ← Ana Panel
          </a>
          <a href="/admin/leads" className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
            Leads
          </a>
        </div>
      </header>

      <main className="p-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Doğrulama Talepleri</h2>
            <p className="text-xs text-gray-500">{requests.length} kayıt</p>
          </div>
          <div className="flex gap-2">
            {['pending', 'approved', 'rejected', 'removed', 'all'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'
                }`}
              >
                {s === 'pending' ? 'Bekleyenler' : s === 'approved' ? 'Onaylananlar' : s === 'rejected' ? 'Reddedilenler' : s === 'removed' ? 'Kaldırılanlar' : 'Tümü'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-20 text-center text-gray-400 text-sm">Yükleniyor…</div>
          ) : requests.length === 0 ? (
            <div className="py-20 text-center text-gray-400 text-sm">Talep bulunamadı.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Terapist Adı</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Talep Tipi</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">E-posta</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Telefon</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Tarih</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Durum</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{r.full_name}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <span className={`text-xs font-medium ${r.request_type === 'removal' ? 'text-red-600' : 'text-gray-700'}`}>
                          {REQUEST_TYPE_LABELS[r.request_type] ?? r.request_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.email}</td>
                      <td className="px-4 py-3 text-gray-600">{r.phone}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(r.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">{statusBadge(r.status)}</td>
                      <td className="px-4 py-3">
                        <a
                          href={`/admin/verification-requests/${r.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-brand-600 hover:text-brand-800 hover:bg-brand-50 rounded-lg transition-colors border border-brand-200"
                        >
                          İncele →
                        </a>
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
