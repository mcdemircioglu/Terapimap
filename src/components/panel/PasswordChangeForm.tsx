'use client';

import { useState } from 'react';
import { getBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export function PasswordChangeForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

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

    setPassword('');
    setConfirm('');
    setSuccess(true);
  }

  return (
    <Card className="max-w-md p-6">
      <h2 className="mb-1 text-sm font-semibold text-brand-800">Şifre değiştir</h2>
      <p className="mb-4 text-sm text-brand-500">
        Panelde bir sonraki girişinizde yeni şifrenizi kullanacaksınız.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="new-password" className="mb-1 block text-sm font-medium text-brand-700">
            Yeni şifre
          </label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="confirm-password" className="mb-1 block text-sm font-medium text-brand-700">
            Şifre (tekrar)
          </label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Şifreniz güncellendi.</p>}

        <Button type="submit" disabled={loading}>
          {loading ? 'Kaydediliyor...' : 'Şifreyi kaydet'}
        </Button>
      </form>
    </Card>
  );
}
