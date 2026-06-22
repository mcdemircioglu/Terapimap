'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

type VerificationRequest = {
  id: string;
  professional_id: string | null;
  request_type: 'update' | 'photo_update' | 'removal';
  full_name: string;
  email: string;
  phone: string;
  title: string | null;
  city: string | null;
  district: string | null;
  clinic_name: string | null;
  address: string | null;
  website: string | null;
  instagram: string | null;
  offers_online: boolean | null;
  offers_in_person: boolean | null;
  specialties: string[] | null;
  bio: string | null;
  photo_url: string | null;
  message: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
};

type Professional = {
  id: string;
  name: string;
  title: string | null;
  city: string;
  district: string | null;
  clinic_name: string | null;
  address: string | null;
  website_url: string | null;
  instagram_url: string | null;
  is_online: boolean;
  is_in_person: boolean;
  about: string | null;
  image_url: string | null;
  phone: string | null;
  email: string | null;
  is_verified: boolean;
  is_visible: boolean;
  specialties: { id: string; name: string; slug: string }[];
};

const SESSION_KEY = 'terapimap_admin_pw';

function Row({ label, old: oldVal, next: newVal }: { label: string; old?: string | null; next?: string | null }) {
  const changed = newVal !== undefined && newVal !== null && newVal !== '' && newVal !== oldVal;
  return (
    <div className="grid grid-cols-3 gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs font-medium text-gray-500 self-center">{label}</span>
      <span className="text-sm text-gray-700">{oldVal ?? <em className="text-gray-400">—</em>}</span>
      <span className={`text-sm font-medium ${changed ? 'text-brand-700 bg-brand-50 px-2 py-0.5 rounded' : 'text-gray-400'}`}>
        {newVal ?? <em className="text-gray-400">Değiştirilmiyor</em>}
      </span>
    </div>
  );
}

function BoolRow({ label, old: oldVal, next: newVal }: { label: string; old?: boolean | null; next?: boolean | null }) {
  const fmt = (v: boolean | null | undefined) => v === null || v === undefined ? null : v ? 'Evet' : 'Hayır';
  return <Row label={label} old={fmt(oldVal)} next={fmt(newVal)} />;
}

export default function VerificationRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const [password, setPassword] = useState<string | null>(null);
  const [pw, setPw] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [vr, setVr] = useState<VerificationRequest | null>(null);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [adminNote, setAdminNote] = useState('');

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

  const loadData = useCallback(async () => {
    if (!password || !params.id) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/admin/verification-requests/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setVr(data.verificationRequest);
        setProfessional(data.professional);
        setAdminNote(data.verificationRequest?.admin_note ?? '');
      }
    } finally {
      setLoading(false);
    }
  }, [password, params.id, apiFetch]);

  useEffect(() => {
    if (password) loadData();
  }, [password, loadData]);

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
      if (data.ok) { sessionStorage.setItem(SESSION_KEY, pw); setPassword(pw); }
      else setLoginError('Hatalı şifre.');
    } catch { setLoginError('Bağlantı hatası.'); }
    finally { setLoginLoading(false); }
  };

  const doAction = async (action: 'approve' | 'reject' | 'remove' | 'note') => {
    setActionLoading(true);
    setFlash(null);
    try {
      const res = await apiFetch(`/api/admin/verification-requests/${params.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, admin_note: adminNote }),
      });
      const data = await res.json();
      if (res.ok) {
        const msgs: Record<string, string> = {
          approve: 'Talep onaylandı ve profil güncellendi.',
          reject: 'Talep reddedildi.',
          remove: 'Profil kaldırıldı.',
          note: 'Not kaydedildi.',
        };
        setFlash({ type: 'success', text: msgs[action] ?? 'İşlem tamamlandı.' });
        loadData();
      } else {
        setFlash({ type: 'error', text: data.error ?? 'Bir hata oluştu.' });
      }
    } catch {
      setFlash({ type: 'error', text: 'Bağlantı hatası.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (!password) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm border border-gray-100">
          <h1 className="text-xl font-bold text-gray-900 mb-6 text-center">Terapimap Admin</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Şifre"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
            {loginError && <p className="text-red-600 text-sm">{loginError}</p>}
            <button type="submit" disabled={loginLoading || !pw}
              className="w-full bg-brand-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-brand-700 disabled:opacity-50">
              {loginLoading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isPending = vr?.status === 'pending';
  const isRemoval = vr?.request_type === 'removal';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <a href="/admin/verification-requests" className="text-sm text-gray-500 hover:text-gray-800">← Talep Listesi</a>
        </div>
        <a href="/admin" className="text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-3 py-1.5 rounded-lg">Ana Panel</a>
      </header>

      {flash && (
        <div className={`mx-6 mt-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between gap-3 ${
          flash.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <span>{flash.type === 'success' ? '✓ ' : '✕ '}{flash.text}</span>
          <button onClick={() => setFlash(null)} className="text-lg leading-none opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      <main className="p-6 max-w-5xl mx-auto">
        {loading ? (
          <div className="py-20 text-center text-gray-400">Yükleniyor…</div>
        ) : !vr ? (
          <div className="py-20 text-center text-gray-400">Talep bulunamadı.</div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
            {/* Left — comparison */}
            <div className="space-y-5">
              {/* Request meta */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{vr.full_name}</h2>
                    <p className="text-sm text-gray-500">{vr.email} · {vr.phone}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(vr.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                      isRemoval ? 'bg-red-50 text-red-700 border-red-200' : 'bg-brand-50 text-brand-700 border-brand-200'
                    }`}>
                      {isRemoval ? '🗑 Profil Kaldırma' : vr.request_type === 'photo_update' ? '📷 Fotoğraf Güncelleme' : '✏️ Profil Güncelleme'}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      vr.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      vr.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                      vr.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                      'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {vr.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Photo comparison */}
              {(vr.photo_url || professional?.image_url) && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Profil Fotoğrafı</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-gray-400 mb-2 font-medium">Mevcut</p>
                      {professional?.image_url ? (
                        <img src={professional.image_url} alt="Mevcut" className="w-24 h-24 rounded-xl object-cover border border-gray-200" />
                      ) : (
                        <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-xs">Yok</div>
                      )}
                    </div>
                    {vr.photo_url && (
                      <div>
                        <p className="text-xs text-brand-600 mb-2 font-medium">Talep edilen →</p>
                        <img src={vr.photo_url} alt="Yeni" className="w-24 h-24 rounded-xl object-cover border-2 border-brand-300" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Field comparison */}
              {!isRemoval && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase">Alan</span>
                    <span className="text-xs font-bold text-gray-400 uppercase">Mevcut</span>
                    <span className="text-xs font-bold text-brand-500 uppercase">Talep Edilen</span>
                  </div>
                  <Row label="Ad Soyad" old={professional?.name} next={vr.full_name} />
                  <Row label="Ünvan" old={professional?.title} next={vr.title} />
                  <Row label="Şehir" old={professional?.city} next={vr.city} />
                  <Row label="İlçe" old={professional?.district} next={vr.district} />
                  <Row label="Klinik" old={professional?.clinic_name} next={vr.clinic_name} />
                  <Row label="Adres" old={professional?.address} next={vr.address} />
                  <Row label="Web Sitesi" old={professional?.website_url} next={vr.website} />
                  <Row label="Instagram" old={professional?.instagram_url} next={vr.instagram} />
                  <BoolRow label="Online" old={professional?.is_online} next={vr.offers_online} />
                  <BoolRow label="Yüz yüze" old={professional?.is_in_person} next={vr.offers_in_person} />
                  {vr.specialties && vr.specialties.length > 0 && (
                    <Row
                      label="Uzmanlıklar"
                      old={(professional?.specialties ?? []).map((s) => s.name).join(', ') || null}
                      next={vr.specialties.join(', ')}
                    />
                  )}
                  {vr.bio && <Row label="Hakkında" old={professional?.about} next={vr.bio} />}
                </div>
              )}

              {/* Removal message */}
              {isRemoval && vr.message && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-red-700 mb-2">Kaldırma Gerekçesi</h3>
                  <p className="text-sm text-red-800 whitespace-pre-line">{vr.message}</p>
                </div>
              )}

              {/* Extra message */}
              {!isRemoval && vr.message && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">Ek Açıklama</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{vr.message}</p>
                </div>
              )}
            </div>

            {/* Right — actions */}
            <div className="space-y-4">
              {/* Current professional info */}
              {professional && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Mevcut Profil</h3>
                  <div className="flex items-center gap-3 mb-3">
                    {professional.image_url ? (
                      <img src={professional.image_url} alt={professional.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm">
                        {professional.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{professional.name}</p>
                      <p className="text-xs text-gray-500">{professional.city}{professional.district ? ` · ${professional.district}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 text-xs">
                    {professional.is_verified && <span className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full border border-brand-200">✓ Doğrulanmış</span>}
                    {professional.is_online && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">Online</span>}
                    {professional.is_in_person && <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded-full">Yüz yüze</span>}
                  </div>
                </div>
              )}

              {/* Admin note */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Admin Notu</h3>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="İç not ekle…"
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                />
                <button
                  onClick={() => doAction('note')}
                  disabled={actionLoading}
                  className="mt-2 w-full py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Notu Kaydet
                </button>
              </div>

              {/* Action buttons */}
              {isPending && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Aksiyonlar</h3>

                  {!isRemoval && (
                    <button
                      onClick={() => doAction('approve')}
                      disabled={actionLoading}
                      className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      ✓ Onayla ve Profili Güncelle
                    </button>
                  )}

                  {isRemoval && (
                    <button
                      onClick={() => { if (window.confirm('Profili yayından kaldırmak istediğinizden emin misiniz?')) doAction('remove'); }}
                      disabled={actionLoading}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      🗑 Profili Kaldır
                    </button>
                  )}

                  <button
                    onClick={() => doAction('reject')}
                    disabled={actionLoading}
                    className="w-full py-2.5 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    ✕ Reddet
                  </button>
                </div>
              )}

              {!isPending && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm text-gray-500 text-center">
                  Bu talep zaten işleme alınmış.<br />
                  <strong>Durum:</strong> {vr?.status}
                  {vr?.admin_note && <p className="mt-2 text-xs italic">"{vr.admin_note}"</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
