'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { CancelAppointmentButton } from '@/components/panel/CancelAppointmentButton';

export function PendingAppointmentActions({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/panel/appointments/${appointmentId}/accept`, { method: 'POST' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error ?? 'Onaylanamadı.');
        return;
      }
      router.refresh();
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="primary" onClick={handleAccept} disabled={loading}>
          {loading ? 'Onaylanıyor…' : 'Kabul Et'}
        </Button>
        <CancelAppointmentButton
          appointmentId={appointmentId}
          label="Reddet"
          confirmLabel="Evet, reddet"
          errorFallback="Reddedilemedi."
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
