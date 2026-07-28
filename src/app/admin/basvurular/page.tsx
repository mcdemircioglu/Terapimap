'use client';

/**
 * /admin/basvurular — "Uzman Üye Ol" başvuruları.
 * request_type='new' talepleri; onaylanınca yeni professional oluşturulur
 * (PUT /api/admin/verification-requests/[id] action=approve).
 */
import { useState, useEffect, useCallback, useRef } from 'react';

type Application = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  title: string | null;
  professional_type: string | null;
  city: string | null;
  district: string | null;
  bio: string | null;
  website: string | null;
  instagram: string | null;
  google_maps_url: string | null;
  offers_online: boolean | null;
  offers_in_person: boolean | null;
  specialties: string[] | null;
  status: string;
  admin_note: string | null;
  created_at: string;
};

type Flash = { type: 'success' | 'error'; text: string };
const SESSION_KEY = 'terapimap_admin_pw';

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending:  { label: 'Bekliyor',    cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  approved: { label: 'Onaylandı',   cls: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: 'Reddedildi',  cls: 'bg-red-50 text-red-700 border-red-200' },
};

function Btn({
  children, onClick, variant = 'primary', disabled, className,
}: {
  children: React.ReactNode; onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger'; disabled?: boolean; className?: string;
}) {
  const styles: Record<string, string> = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50',
    danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed ${styles[variant]} ${className ?? ''}`}>
      {children}
    </button>
  );
}

function LoginForm({ onAuth }: { onAuth: (pw: string) => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (data.ok) { sessionStorage.setItem(SESSION_KEY, pw); onAuth(pw); }
      else setError('Hatalı şifre.');
    } catch { setError('Bağlantı hatası.'); }
    finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-accent-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 text-center mb-6">Terapimap Admin</h1>
        <form onSubmit={submit} className="space-y-4">
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <Btn disabled={loading || !pw} className="w-full">{loading ? 'Giriş…' : 'Giriş Yap'}</Btn>
        </form>
      </div>
    </div>
  );
}

export default function BasvurularPage() {
  const [password, setPassword] = useState<string | null>(null);
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState<Flash | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) setPassword(stored);
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
          'x-admin-password': password ?? '',
          ...((options.headers as Record<string, string>) ?? {}),
        },
      }),
    [password],
  );

  const load = useCallback(async () => {
    if (!password) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/admin/verification-requests?type=new&status=${statusFilter}`);
      if (res.ok) setItems(await res.json());
    } finally { setLoading(false); }
  }, [password, statusFilter, apiFetch]);

  useEffect(() => { if (password) load(); }, [password, load]);

  const act = async (id: string, action: 'approve' | 'reject') => {
    setBusyId(id);
    try {
      const res = await apiFetch(`/api/admin/verification-requests/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ action }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showFlash({ type: 'success', text: action === 'approve' ? 'Başvuru onaylandı, profil oluşturuldu.' : 'Başvuru reddedildi.' });
        load();
      } else {
        showFlash({ type: 'error', text: data.error ?? 'İşlem başarısız.' });
      }
    } finally { setBusyId(null); }
  };

  if (!password) return <LoginForm onAuth={setPassword} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-900">Terapimap Admin</span>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600 font-medium">Başvurular</span>
        </div>
        <div className="flex items-center gap-2">
          <a href="/admin" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">Profesyoneller</a>
          <a href="/admin/verification-requests" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">Doğrulama Talepleri</a>
          <a href="/admin/leads" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">Leads</a>
        </div>
      </div>

      {flash && (
        <div className={`mx-6 mt-4 rounded-lg px-4 py-3 text-sm ${flash.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {flash.text}
        </div>
      )}

      <div className="p-6">
        {/* Filtre */}
        <div className="mb-4 flex gap-2">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                statusFilter === s ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              {s === 'pending' ? 'Bekleyen' : s === 'approved' ? 'Onaylı' : s === 'rejected' ? 'Reddedilen' : 'Tümü'}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Yükleniyor…</p>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
            Bu durumda başvuru yok.
          </p>
        ) : (
          <div className="space-y-4">
            {items.map((a) => {
              const meta = STATUS_META[a.status] ?? { label: a.status, cls: 'bg-gray-50 text-gray-600 border-gray-200' };
              return (
                <div key={a.id} className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{a.full_name}</h3>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium border ${meta.cls}`}>{meta.label}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {a.title ?? '—'} · {[a.district, a.city].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(a.created_at).toLocaleString('tr-TR')}</p>
                  </div>

                  <div className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                    <p><span className="text-gray-400">E-posta:</span> <a href={`mailto:${a.email}`} className="text-brand-600 hover:underline">{a.email}</a></p>
                    <p><span className="text-gray-400">Telefon:</span> {a.phone}</p>
                    <p><span className="text-gray-400">Görüşme:</span> {[a.offers_in_person && 'Yüz yüze', a.offers_online && 'Online'].filter(Boolean).join(', ') || '—'}</p>
                    {a.website && <p><span className="text-gray-400">Website:</span> <a href={a.website} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{a.website}</a></p>}
                    {a.instagram && <p><span className="text-gray-400">Instagram:</span> <a href={a.instagram} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">{a.instagram}</a></p>}
                    {a.google_maps_url && <p><span className="text-gray-400">Google Haritalar:</span> <a href={a.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">Konumu aç</a></p>}
                  </div>

                  {a.specialties && a.specialties.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {a.specialties.map((s) => (
                        <span key={s} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-brand-700 border border-brand-100">{s}</span>
                      ))}
                    </div>
                  )}

                  {a.bio && (
                    <p className="mt-3 whitespace-pre-line rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{a.bio}</p>
                  )}

                  {a.status === 'pending' && (
                    <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
                      <Btn onClick={() => act(a.id, 'approve')} disabled={busyId === a.id}>
                        {busyId === a.id ? 'İşleniyor…' : 'Onayla ve Yayınla'}
                      </Btn>
                      <Btn variant="danger" onClick={() => act(a.id, 'reject')} disabled={busyId === a.id}>
                        Reddet
                      </Btn>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
