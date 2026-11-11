'use client';

/**
 * /admin/dogrulama-takibi — Onaylı terapistlerin doğrulama (outreach) takibi.
 * Her terapist için e-posta daveti, WhatsApp daveti, dönüş ve doğrulama durumu tek tabloda;
 * WhatsApp butonu e-posta davetiyle aynı metni wa.me'de açar ve kişiyi işaretler.
 * E-posta gönderimi ayrı sayfada kalır: /admin/davetler.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { normalizeTrPhone, buildInviteMessage } from '@/lib/whatsappOutreach';

const SESSION_KEY = 'terapimap_admin_pw';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://terapimap.com';
const PAGE_SIZE = 150;

type Row = {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  district: string | null;
  phone: string | null;
  email: string | null;
  is_verified: boolean;
  verification_invited_at: string | null;
  whatsapp_invited_at: string | null;
  whatsapp_invite_count: number | null;
  whatsapp_replied_at: string | null;
};

type Status = 'none' | 'mail' | 'wa' | 'both' | 'verified';
const STATUS_LABEL: Record<Status, string> = {
  none: 'Hiç ulaşılmadı',
  mail: 'Sadece e-posta',
  wa: 'Sadece WhatsApp',
  both: 'E-posta + WhatsApp',
  verified: 'Doğrulandı',
};
const STATUS_STYLE: Record<Status, string> = {
  none: 'bg-red-50 text-red-700 border-red-200',
  mail: 'bg-blue-50 text-blue-700 border-blue-200',
  wa: 'bg-green-50 text-green-700 border-green-200',
  both: 'bg-purple-50 text-purple-700 border-purple-200',
  verified: 'bg-emerald-100 text-emerald-800 border-emerald-300',
};

function statusOf(p: Row): Status {
  if (p.is_verified) return 'verified';
  if (p.whatsapp_invited_at && p.verification_invited_at) return 'both';
  if (p.whatsapp_invited_at) return 'wa';
  if (p.verification_invited_at) return 'mail';
  return 'none';
}

function fmt(dt: string | null): string {
  if (!dt) return '—';
  try { return new Date(dt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' }); }
  catch { return '—'; }
}

const pct = (a: number, b: number) => (b > 0 ? `%${Math.round((a / b) * 100)}` : '—');

function Btn({
  children, onClick, disabled, variant = 'primary', className,
}: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'whatsapp'; className?: string;
}) {
  const s =
    variant === 'primary' ? 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300'
    : variant === 'whatsapp' ? 'bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300'
    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:text-gray-400';
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed ${s} ${className ?? ''}`}>
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

type BulkPreview = {
  matched: { id: string; name: string; city: string | null; alreadyInvited: boolean; alreadyReplied: boolean }[];
  unmatched: string[];
  invalid: string[];
};

export default function DogrulamaTakibiPage() {
  const [password, setPassword] = useState<string | null>(null);
  const [list, setList] = useState<Row[] | null>(null);
  const [campaignDateText, setCampaignDateText] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [city, setCity] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | Status>('');
  const [onlyPhone, setOnlyPhone] = useState(false);
  const [q, setQ] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const [bulkText, setBulkText] = useState('');
  const [bulkKind, setBulkKind] = useState<'sent' | 'replied'>('sent');
  const [bulkDate, setBulkDate] = useState('');
  const [bulkPreview, setBulkPreview] = useState<BulkPreview | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    const s = sessionStorage.getItem(SESSION_KEY);
    if (s) setPassword(s);
  }, []);

  const apiFetch = useCallback(
    (options: RequestInit = {}) =>
      fetch('/api/admin/whatsapp-outreach', {
        ...options,
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password ?? '' },
      }),
    [password],
  );

  const load = useCallback(async () => {
    if (!password) return;
    setLoadError(null);
    const res = await apiFetch();
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setLoadError(d.error ?? 'Liste yüklenemedi.');
      return;
    }
    const d = await res.json();
    setList(d.list ?? []);
    setCampaignDateText(d.campaignDateText ?? null);
  }, [password, apiFetch]);

  useEffect(() => { if (password) load(); }, [password, load]);
  useEffect(() => { setVisible(PAGE_SIZE); }, [city, statusFilter, onlyPhone, q]);

  const patchRow = (id: string, patch: Partial<Row>) =>
    setList((l) => l?.map((r) => (r.id === id ? { ...r, ...patch } : r)) ?? l);

  /* ── Özetler ─────────────────────────────────────────────────────────── */
  const cities = useMemo(() => {
    const s = new Set<string>();
    list?.forEach((p) => p.city && s.add(p.city));
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [list]);

  const summary = useMemo(() => {
    const all = list ?? [];
    const waSent = all.filter((p) => p.whatsapp_invited_at);
    const mailSent = all.filter((p) => p.verification_invited_at);
    return {
      total: all.length,
      verified: all.filter((p) => p.is_verified).length,
      none: all.filter((p) => statusOf(p) === 'none').length,
      noneWithPhone: all.filter((p) => statusOf(p) === 'none' && normalizeTrPhone(p.phone)).length,
      waSent: waSent.length,
      waReplied: all.filter((p) => p.whatsapp_replied_at).length,
      waVerified: waSent.filter((p) => p.is_verified).length,
      mailSent: mailSent.length,
      mailVerified: mailSent.filter((p) => p.is_verified).length,
    };
  }, [list]);

  const byCity = useMemo(() => {
    const m = new Map<string, { total: number; none: number; wa: number; replied: number; waVerified: number; verified: number }>();
    (list ?? []).forEach((p) => {
      const k = p.city ?? '—';
      const c = m.get(k) ?? { total: 0, none: 0, wa: 0, replied: 0, waVerified: 0, verified: 0 };
      c.total++;
      if (p.is_verified) c.verified++;
      if (statusOf(p) === 'none') c.none++;
      if (p.whatsapp_invited_at) { c.wa++; if (p.is_verified) c.waVerified++; }
      if (p.whatsapp_replied_at) c.replied++;
      m.set(k, c);
    });
    return Array.from(m.entries()).sort((a, b) => b[1].none - a[1].none);
  }, [list]);

  /* ── Filtreli liste: hiç ulaşılmayanlar önce, sonra şehir ──────────────── */
  const filtered = useMemo(() => {
    const needle = q.trim().toLocaleLowerCase('tr');
    const rank: Record<Status, number> = { none: 0, mail: 1, wa: 2, both: 3, verified: 4 };
    return (list ?? [])
      .filter((p) => !city || p.city === city)
      .filter((p) => !statusFilter || statusOf(p) === statusFilter)
      .filter((p) => !onlyPhone || normalizeTrPhone(p.phone))
      .filter((p) => !needle || p.name.toLocaleLowerCase('tr').includes(needle) || (p.phone ?? '').includes(needle))
      .sort((a, b) =>
        rank[statusOf(a)] - rank[statusOf(b)]
        || (a.city ?? '').localeCompare(b.city ?? '', 'tr')
        || (a.district ?? '').localeCompare(b.district ?? '', 'tr')
        || a.name.localeCompare(b.name, 'tr'));
  }, [list, city, statusFilter, onlyPhone, q]);

  /* ── Satır işlemleri ─────────────────────────────────────────────────── */
  const openWhatsApp = async (p: Row) => {
    const num = normalizeTrPhone(p.phone);
    if (!num) return;
    const msg = buildInviteMessage(
      { id: p.id, name: p.name, slug: p.slug, campaignDateText }, SITE_URL);
    // Tarayıcı açılışı tıklamayla aynı senkron akışta olmalı; işaretleme sonra yapılır.
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    setBusyId(p.id);
    try {
      const res = await apiFetch({ method: 'POST', body: JSON.stringify({ action: 'sent', id: p.id }) });
      const d = await res.json();
      if (!res.ok) { setFlash(d.error ?? 'İşaretlenemedi.'); return; }
      patchRow(p.id, { whatsapp_invited_at: d.whatsapp_invited_at, whatsapp_invite_count: d.whatsapp_invite_count });
    } finally { setBusyId(null); }
  };

  const post = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    try {
      const res = await apiFetch({ method: 'POST', body: JSON.stringify({ id, ...body }) });
      const d = await res.json();
      if (!res.ok) { setFlash(d.error ?? 'İşlem başarısız.'); return; }
      const { ok: _ok, ...patch } = d; void _ok;
      patchRow(id, patch);
    } finally { setBusyId(null); }
  };

  /* ── Toplu işaretleme ────────────────────────────────────────────────── */
  const parsePhones = () => bulkText.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);

  const runBulk = async (dryRun: boolean) => {
    const phones = parsePhones();
    if (phones.length === 0) { setFlash('Önce numara listesini yapıştırın.'); return; }
    setBulkBusy(true); setFlash(null);
    try {
      const res = await apiFetch({
        method: 'POST',
        body: JSON.stringify({ action: 'bulk', phones, kind: bulkKind, date: bulkDate || undefined, dryRun }),
      });
      const d = await res.json();
      if (!res.ok) { setFlash(d.error ?? 'Toplu işlem başarısız.'); return; }
      if (dryRun) { setBulkPreview({ matched: d.matched, unmatched: d.unmatched, invalid: d.invalid }); return; }
      setBulkPreview(null);
      setBulkText('');
      setFlash(`${d.matched.length} profil işlendi. Eşleşmeyen: ${d.unmatched.length}, geçersiz: ${d.invalid.length}.`);
      await load();
    } finally { setBulkBusy(false); }
  };

  /* ── CSV ─────────────────────────────────────────────────────────────── */
  const exportCsv = () => {
    const esc = (v: string | number | null) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = ['Ad', 'Şehir', 'İlçe', 'Telefon', 'E-posta', 'Durum', 'E-posta daveti', 'WhatsApp daveti', 'WhatsApp adedi', 'Dönüş', 'Doğrulandı'];
    const lines = filtered.map((p) => [
      p.name, p.city, p.district, p.phone, p.email, STATUS_LABEL[statusOf(p)],
      fmt(p.verification_invited_at), fmt(p.whatsapp_invited_at), p.whatsapp_invite_count ?? 0,
      fmt(p.whatsapp_replied_at), p.is_verified ? 'Evet' : 'Hayır',
    ].map(esc).join(','));
    // BOM: Excel'in Türkçe karakterleri doğru açması için.
    const blob = new Blob(['﻿' + [head.map(esc).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `dogrulama-takibi-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (!password) return <LoginForm onAuth={setPassword} />;

  const stat = (label: string, value: string | number, sub?: string) => (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-gray-900">{list ? value : '…'}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-900">Terapimap Admin</span>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-600 font-medium">Doğrulama Takibi</span>
        </div>
        <div className="flex items-center gap-2">
          <a href="/admin" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">Profesyoneller</a>
          <a href="/admin/davetler" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">E-posta Davetleri</a>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-5">
        {loadError && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{loadError}</div>}
        {flash && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700 flex justify-between">
            <span>{flash}</span>
            <button onClick={() => setFlash(null)} className="text-green-700">✕</button>
          </div>
        )}

        {/* Özet kartları */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {stat('Onaylı terapist', summary.total)}
          {stat('Doğrulanan', summary.verified, pct(summary.verified, summary.total) + ' tümü içinde')}
          {stat('Hiç ulaşılmadı', summary.none, `${summary.noneWithPhone} tanesinin telefonu var`)}
          {stat('WhatsApp gönderilen', summary.waSent, `${summary.waReplied} dönüş`)}
          {stat('WhatsApp dönüşümü', pct(summary.waVerified, summary.waSent), `${summary.waVerified} / ${summary.waSent} doğruladı`)}
          {stat('E-posta dönüşümü', pct(summary.mailVerified, summary.mailSent), `${summary.mailVerified} / ${summary.mailSent} doğruladı`)}
        </div>
        <p className="text-xs text-gray-500 -mt-2">
          Dönüşüm = davet gönderilenler içinde şu an doğrulanmış olanların oranı. Aynı kişiye iki kanaldan ulaşıldıysa her iki kanalda da sayılır.
        </p>

        {/* Şehir bazında */}
        <details className="rounded-xl border border-gray-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-700">Şehir bazında özet (en çok ulaşılmayan üstte)</summary>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2">Şehir</th><th className="px-4 py-2">Toplam</th>
                  <th className="px-4 py-2">Hiç ulaşılmadı</th><th className="px-4 py-2">WhatsApp</th>
                  <th className="px-4 py-2">Dönüş</th><th className="px-4 py-2">WA dönüşüm</th>
                  <th className="px-4 py-2">Doğrulanan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {byCity.map(([k, c]) => (
                  <tr key={k} className="hover:bg-gray-50 cursor-pointer" onClick={() => setCity(k === '—' ? '' : k)}>
                    <td className="px-4 py-1.5 font-medium text-gray-900">{k}</td>
                    <td className="px-4 py-1.5">{c.total}</td>
                    <td className="px-4 py-1.5 text-red-700">{c.none}</td>
                    <td className="px-4 py-1.5">{c.wa}</td>
                    <td className="px-4 py-1.5">{c.replied}</td>
                    <td className="px-4 py-1.5">{pct(c.waVerified, c.wa)}</td>
                    <td className="px-4 py-1.5">{c.verified}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        {/* Toplu işaretleme */}
        <details className="rounded-xl border border-gray-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-700">Numara listesiyle toplu işaretle (geçmiş WhatsApp gönderimleri / dönüşler)</summary>
          <div className="p-4 border-t border-gray-100 space-y-3">
            <textarea value={bulkText} onChange={(e) => { setBulkText(e.target.value); setBulkPreview(null); }}
              rows={5} placeholder="Her satıra bir numara: 0532 123 45 67, +90 532..., 5321234567"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-400" />
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">İşaret türü</label>
                <select value={bulkKind} onChange={(e) => { setBulkKind(e.target.value as 'sent' | 'replied'); setBulkPreview(null); }}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                  <option value="sent">WhatsApp gönderildi</option>
                  <option value="replied">Dönüş yaptı</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tarih (boşsa bugün)</label>
                <input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
              </div>
              <Btn variant="secondary" disabled={bulkBusy} onClick={() => runBulk(true)}>Önizle</Btn>
              <Btn disabled={bulkBusy || !bulkPreview || bulkPreview.matched.length === 0} onClick={() => runBulk(false)}>
                {bulkPreview ? `${bulkPreview.matched.length} profili işaretle` : 'İşaretle'}
              </Btn>
            </div>
            {bulkPreview && (
              <div className="text-sm space-y-2">
                <p className="text-gray-700">
                  <strong>{bulkPreview.matched.length}</strong> profil eşleşti
                  ({bulkPreview.matched.filter((m) => m.alreadyInvited).length} tanesi zaten WhatsApp işaretli, tarihi korunur).
                </p>
                {bulkPreview.unmatched.length > 0 && (
                  <p className="text-amber-700">Veritabanında bulunamayan {bulkPreview.unmatched.length} numara: {bulkPreview.unmatched.join(', ')}</p>
                )}
                {bulkPreview.invalid.length > 0 && (
                  <p className="text-red-700">Geçersiz format {bulkPreview.invalid.length}: {bulkPreview.invalid.join(', ')}</p>
                )}
                <div className="max-h-40 overflow-y-auto text-xs text-gray-600 border border-gray-100 rounded-lg p-2">
                  {bulkPreview.matched.map((m) => <div key={m.id}>{m.name} · {m.city ?? '—'}</div>)}
                </div>
              </div>
            )}
          </div>
        </details>

        {/* Filtreler */}
        <div className="flex flex-wrap items-center gap-2">
          <select value={city} onChange={(e) => setCity(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
            <option value="">Tüm şehirler</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as '' | Status)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white">
            <option value="">Tüm durumlar</option>
            {(Object.keys(STATUS_LABEL) as Status[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ad veya telefon ara"
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-52" />
          <label className="flex items-center gap-1.5 text-sm text-gray-600">
            <input type="checkbox" checked={onlyPhone} onChange={(e) => setOnlyPhone(e.target.checked)} /> Sadece telefonu olanlar
          </label>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-500">{filtered.length} kişi</span>
            <Btn variant="secondary" onClick={load}>Yenile</Btn>
            <Btn variant="secondary" onClick={exportCsv} disabled={!list}>CSV indir</Btn>
          </div>
        </div>

        {/* Tablo */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {!list ? <p className="p-6 text-sm text-gray-500">Yükleniyor…</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-2">Ad Soyad</th><th className="px-3 py-2">Şehir / İlçe</th>
                    <th className="px-3 py-2">Telefon</th><th className="px-3 py-2">Durum</th>
                    <th className="px-3 py-2">E-posta</th><th className="px-3 py-2">WhatsApp</th>
                    <th className="px-3 py-2">Dönüş</th><th className="px-3 py-2 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.slice(0, visible).map((p) => {
                    const st = statusOf(p);
                    const hasPhone = !!normalizeTrPhone(p.phone);
                    const busy = busyId === p.id;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-900">{p.name}</td>
                        <td className="px-3 py-2 text-gray-600">{[p.city, p.district].filter(Boolean).join(' / ') || '—'}</td>
                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                          {p.phone ?? '—'}{p.phone && !hasPhone && <span className="text-red-600 text-xs ml-1">(geçersiz)</span>}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_STYLE[st]}`}>{STATUS_LABEL[st]}</span>
                        </td>
                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{fmt(p.verification_invited_at)}</td>
                        <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                          {fmt(p.whatsapp_invited_at)}{(p.whatsapp_invite_count ?? 0) > 1 && ` (${p.whatsapp_invite_count}x)`}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {p.whatsapp_replied_at ? (
                            <button disabled={busy} onClick={() => post(p.id, { action: 'replied', value: false })}
                              className="text-green-700 text-xs underline" title="Geri al">✓ {fmt(p.whatsapp_replied_at)}</button>
                          ) : p.whatsapp_invited_at ? (
                            <button disabled={busy} onClick={() => post(p.id, { action: 'replied', value: true })}
                              className="text-gray-500 text-xs underline">Dönüş yaptı</button>
                          ) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          {!p.is_verified && (
                            <Btn variant="whatsapp" disabled={!hasPhone || busy} onClick={() => openWhatsApp(p)}>
                              {p.whatsapp_invited_at ? 'Tekrar gönder' : 'WhatsApp'}
                            </Btn>
                          )}
                          {p.whatsapp_invited_at && (
                            <button disabled={busy} className="ml-2 text-xs text-gray-400 hover:text-red-600"
                              onClick={() => { if (confirm(`${p.name} için WhatsApp işareti kaldırılsın mı?`)) post(p.id, { action: 'unsent' }); }}>
                              Geri al
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length > visible && (
                <div className="p-3 text-center border-t border-gray-100">
                  <Btn variant="secondary" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                    Daha fazla göster ({filtered.length - visible} kaldı)
                  </Btn>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
