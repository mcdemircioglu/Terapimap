'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function PanelGirisPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = getBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError('E-posta veya şifre hatalı. Lütfen tekrar deneyin.');
      return;
    }

    router.push('/panel');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm p-8">
        <h1 className="mb-1 text-xl font-semibold text-brand-900">Terapist Paneli</h1>
        <p className="mb-6 text-sm text-brand-500">
          Terapimap üzerindeki profilinizi yönetmek için giriş yapın.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-brand-700">
              E-posta
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-brand-700">
              Şifre
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş yap'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-brand-400">
          Hesabınız yoksa, profilinizin doğrulanmasının ardından tarafınıza
          gönderilen davet e-postasındaki bağlantıyla şifrenizi
          belirleyebilirsiniz.
        </p>
      </Card>
    </main>
  );
}
