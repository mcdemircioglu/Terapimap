'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/panel/appointments/${appointmentId}/cancel`, { method: 'POST' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error ?? 'İptal edilemedi.');
        return;
      }
      router.refresh();
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-brand-600">Emin misiniz?</span>
        <Button size="sm" variant="primary" onClick={handleCancel} disabled={loading}>
          {loading ? 'İptal ediliyor…' : 'Evet, iptal et'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={loading}>
          Vazgeç
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button size="sm" variant="outline" onClick={() => setConfirming(true)}>
        Randevuyu iptal et
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
