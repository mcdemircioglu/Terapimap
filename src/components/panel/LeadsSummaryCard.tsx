import Link from 'next/link';
import { Card } from '@/components/ui/Card';

export function LeadsSummaryCard({
  total,
  pending,
}: {
  total: number;
  pending: number;
}) {
  return (
    <Card className="p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-brand-800">Talepler</h2>
        <span className="text-lg font-semibold text-brand-900">{total}</span>
      </div>

      {total === 0 ? (
        <p className="text-sm text-brand-500">
          Henüz size iletilmiş bir danışan talebi yok.
        </p>
      ) : pending > 0 ? (
        <p className="text-sm text-brand-500">
          <span className="font-medium text-brand-800">{pending} talebe</span> henüz
          iletişime geçtiğinizi bildirmediniz.
        </p>
      ) : (
        <p className="text-sm text-brand-500">Tüm taleplere iletişime geçtiniz — harika!</p>
      )}

      <Link
        href="/panel/talepler"
        className="mt-3 inline-block text-sm font-medium text-brand-600 hover:text-brand-800"
      >
        Talepleri görüntüle →
      </Link>
    </Card>
  );
}
