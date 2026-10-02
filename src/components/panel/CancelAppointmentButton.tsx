'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

type Props = {
  appointmentId: string;
  /** Pending (onay bekleyen) bir talebi reddederken "Reddet" göstermek için. */
  label?: string;
  confirmLabel?: string;
  errorFallback?: string;
};

export function CancelAppointmentButton({
  appointmentId,
  label = 'Randevuyu iptal et',
  confirmLabel = 'Evet, iptal et',
  errorFallback = 'İptal edilemedi.',
}: Props) {
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
        setError(d.error ?? errorFallback);
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
          {loading ? 'İşleniyor…' : confirmLabel}
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
        {label}
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
