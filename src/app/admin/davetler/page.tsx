'use client';

/**
 * /admin/davetler — Doğrulama daveti (e-posta outreach) aracı.
 * Maili olan, doğrulanmamış, henüz davet gönderilmemiş terapistlere
 * gruplar halinde kişiselleştirilmiş doğrulama daveti gönderir.
 */
import { useState, useEffect, useCallback } from 'react';

type Result = { name: string; email: string; ok: boolean; error?: string };
type ListItem = { id: string; name: string; city: string | null; email: string; verification_invited_at: string | null };
type Counts = { pending: number; invited: number; list: ListItem[] };
const SESSION_KEY = 'terapimap_admin_pw';

function fmt(dt: string | null): string {
  if (!dt) return '';
  try { return new Date(dt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

function Btn({
  children, onClick, disabled, variant = 'primary', className,
}: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  variant?: 'primary' | 'secondary'; className?: string;
}) {
  const s = variant === 'primary'
    ? 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300'
    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50';
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed ${s} ${className ?? ''}`}>
      {children}
    </button>
  );
}

function LoginForm({ onAuth }: { onAuth: (pw: string) => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      const d = await res.json();
      if (d.ok) { sessionStorage.setItem(SESSION_KEY, pw); onAuth(pw); }
      else setError('Hatalı şifre.');
    } catch { setError('Bağlantı hatası.'); }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-accent-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm border border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 text-center mb-6">Terapimap Admin</h1>
        <form onSubmit={submit} className="space-y-4">
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
          {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <Btn className="w-full">Giriş Yap</Btn>
        </form>
      </div>
    </div>
  );
}

export default function DavetlerPage() {
  const [password, setPassword] = useState<string | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [batch, setBatch] = useState(20);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent'>('all');

  useEffect(() => {
    const s = sessionStorage.getItem(SESSION_KEY);
    if (s) setPassword(s);
  }, []);

  const apiFetch = useCallback(
    (path: string, options: RequestInit = {}) =>
      fetch(path, {
        ...options,
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password ?? '',
          ...((options.headers as Record<string, string>) ?? {}) },
      }),
    [password],
  );

  const loadCounts = useCallback(async () => {
    if (!password) return;
    const res = await apiFetch('/api/admin/verification-invites');
    if (res.ok) setCounts(await res.json());
  }, [password, apiFetch]);

  useEffect(() => { if (password) loadCounts(); }, [password, loadCounts]);

  const sendBatch = async () => {
    if (!confirm(`Sıradaki ${batch} kişiye doğrulama daveti gönderilecek. Onaylıyor musunuz?`)) return;
    setSending(true); setResults(null); setFlash(null);
    try {
      const res = await apiFetch('/api/admin/verification-invites', {
        method: 'POST', body: JSON.stringify({ limit: batch }),
      });
      const d = await res.json();
      if (!res.ok) { setFlash(d.error ?? 'Gönderim başarısız.'); return; }
      setResults(d.results ?? []);
      setFlash(`${d.sent} gönderildi, ${d.failed} başarısız. Kalan: ${d.remaining}.`);
      loadCounts();
    } finally { setSending(false); }
  };

  if (!password) return <LoginForm onAuth={setPassword} />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-900">Terapimap Admin</span>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600 font-medium">Doğrulama Davetleri</span>
        </div>
        <div className="flex items-center gap-2">
          <a href="/admin" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">Profesyoneller</a>
          <a href="/admin/basvurular" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">Başvurular</a>
        </div>
      </div>

      <div className="p-6 max-w-3xl">
        {/* Uyarı */}
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Deliverability notu:</strong> Bir anda çok sayıda soğuk e-posta spam&#39;e düşme riski taşır.
          Günde birkaç grup (ör. 20&#39;şer) gönderip yaymanız önerilir. Gönderilen her kişi otomatik
          işaretlenir; aynı kişiye tekrar gitmez. Sonradan eklediğiniz onaylı terapistler otomatik sıraya girer.
        </div>

        {/* Sayılar */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="text-xs uppercase tracking-wide text-gray-500">Bekleyen (davet gönderilecek)</div>
            <div className="mt-1 text-3xl font-bold text-brand-700">{counts ? counts.pending : '…'}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="text-xs uppercase tracking-wide text-gray-500">Davet gönderilen (toplam)</div>
            <div className="mt-1 text-3xl font-bold text-gray-700">{counts ? counts.invited : '…'}</div>
          </div>
        </div>

        {/* Gönderim */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Grup boyutu</label>
              <input type="number" min={1} max={40} value={batch}
                onChange={(e) => setBatch(Math.max(1, Math.min(40, parseInt(e.target.value, 10) || 1)))}
                className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            </div>
            <Btn onClick={sendBatch} disabled={sending || !counts || counts.pending === 0}>
              {sending ? 'Gönderiliyor…' : `Sıradaki ${batch} kişiye gönder`}
            </Btn>
            <Btn variant="secondary" onClick={loadCounts} disabled={sending}>Yenile</Btn>
          </div>

          {flash && (
            <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
              {flash}
            </div>
          )}
        </div>

        {/* Son gruptaki hata varsa göster */}
        {results && results.some((r) => !r.ok) && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-medium mb-1">Bu grupta gönderilemeyenler:</p>
            <ul className="list-disc pl-5">
              {results.filter((r) => !r.ok).map((r, i) => (
                <li key={i}>{r.name} · {r.email} — {r.error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Terapist listesi */}
        <div className="mt-6 rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">
              E-posta hedef listesi{counts ? ` (${counts.list.length})` : ''}
            </span>
            <div className="flex gap-1.5">
              {([['all', 'Tümü'], ['pending', 'Bekleyen'], ['sent', 'Gönderilen']] as const).map(([k, lbl]) => (
                <button key={k} onClick={() => setFilter(k)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    filter === k ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
          {!counts ? (
            <p className="p-6 text-sm text-gray-500">Yükleniyor…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-2">#</th>
                    <th className="px-4 py-2">Ad Soyad</th>
                    <th className="px-4 py-2">Şehir</th>
                    <th className="px-4 py-2">E-posta</th>
                    <th className="px-4 py-2">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {counts.list
                    .filter((p) => filter === 'all' || (filter === 'sent' ? p.verification_invited_at : !p.verification_invited_at))
                    .map((p, i) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-400">{i + 1}</td>
                        <td className="px-4 py-2 font-medium text-gray-900">{p.name}</td>
                        <td className="px-4 py-2 text-gray-600">{p.city ?? '—'}</td>
                        <td className="px-4 py-2 text-gray-600">{p.email}</td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {p.verification_invited_at ? (
                            <span className="text-green-700">✓ Gönderildi · {fmt(p.verification_invited_at)}</span>
                          ) : (
                            <span className="text-yellow-700">Bekliyor</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
