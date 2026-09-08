'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export function LeadContactButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/panel/leads/${leadId}/mark-contacted`, {
        method: 'POST',
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? 'İşaretlenemedi.');
        return;
      }
      router.refresh();
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button size="sm" variant="outline" onClick={handleClick} disabled={loading}>
        {loading ? 'İşaretleniyor...' : 'İletişime geçtim'}
      </Button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
