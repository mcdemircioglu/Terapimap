'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { EmailOtpType } from '@supabase/supabase-js';
import { getBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

type Mode = 'loading' | 'confirm' | 'password' | 'invalid';

function SifreBelirleInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get('token_hash');
  const typeParam = searchParams.get('type');
  const otpType: EmailOtpType = typeParam === 'recovery' ? 'recovery' : 'invite';

  const [mode, setMode] = useState<Mode>('loading');
  const [confirming, setConfirming] = useState(false);
  const [invalidReason, setInvalidReason] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // İlk yükleme: token_hash URL'de varsa "onayla" adımını göster (OTOMATİK
  // doğrulama YAPMIYORUZ — e-posta güvenlik tarayıcıları (ör. Outlook Safe
  // Links) linke otomatik GET atıp tek kullanımlık daveti tüketebiliyor.
  // Doğrulama yalnızca kullanıcı butona basınca tetiklenir). token_hash
  // yoksa geriye dönük uyumluluk için mevcut oturuma bakılır.
  useEffect(() => {
    if (tokenHash) {
      setMode('confirm');
      return;
    }
    const supabase = getBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setMode(data.session ? 'password' : 'invalid');
    });
  }, [tokenHash]);

  async function handleConfirm() {
    if (!tokenHash) return;
    setConfirming(true);
    setInvalidReason(null);
    const supabase = getBrowserClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });
    setConfirming(false);

    if (verifyError) {
      setInvalidReason(verifyError.message);
      setMode('invalid');
      return;
    }
    setMode('password');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalı.');
      return;
    }
    if (password !== confirm) {
      setError('Şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setLoading(true);
    const supabase = getBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError('Şifre güncellenemedi: ' + updateError.message);
      return;
    }

    router.push('/panel');
    router.refresh();
  }

  if (mode === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-brand-500">Yükleniyor...</p>
      </main>
    );
  }

  if (mode === 'confirm') {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <Card className="w-full max-w-sm p-8 text-center">
          <h1 className="mb-2 text-lg font-semibold text-brand-900">
            Terapimap Paneli'ne hoş geldiniz
          </h1>
          <p className="mb-6 text-sm text-brand-500">
            Şifrenizi belirlemek için devam edin.
          </p>
          <Button onClick={handleConfirm} disabled={confirming} className="w-full">
            {confirming ? 'Doğrulanıyor...' : 'Devam et'}
          </Button>
        </Card>
      </main>
    );
  }

  if (mode === 'invalid') {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <Card className="w-full max-w-sm p-8 text-center">
          <h1 className="mb-2 text-lg font-semibold text-brand-900">
            Davet bağlantısı geçersiz veya süresi dolmuş
          </h1>
          <p className="mb-2 text-sm text-brand-500">
            Lütfen Terapimap ekibinden yeni bir davet isteyin ya da zaten bir
            şifreniz varsa doğrudan giriş yapın.
          </p>
          {invalidReason && (
            <p className="mb-4 text-xs text-brand-300">({invalidReason})</p>
          )}
          <Button onClick={() => router.push('/panel/giris')} className="w-full">
            Giriş sayfasına git
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm p-8">
        <h1 className="mb-1 text-xl font-semibold text-brand-900">Şifrenizi belirleyin</h1>
        <p className="mb-6 text-sm text-brand-500">
          Terapimap panelinize her seferinde bu şifreyle giriş yapacaksınız.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-brand-700">
              Yeni şifre
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-brand-700">
              Şifre (tekrar)
            </label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Şifreyi kaydet ve devam et'}
          </Button>
        </form>
      </Card>
    </main>
  );
}

export default function SifreBelirlePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-4">
          <p className="text-sm text-brand-500">Yükleniyor...</p>
        </main>
      }
    >
      <SifreBelirleInner />
    </Suspense>
  );
}
