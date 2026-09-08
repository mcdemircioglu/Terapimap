import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import type { ProfileCompletenessResult } from '@/lib/panel/profileCompleteness';

function barColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function ProfileCompletenessCard({
  result,
}: {
  result: ProfileCompletenessResult;
}) {
  const { score, missing } = result;

  return (
    <Card className="p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-brand-800">Profil tamamlama skoru</h2>
        <span className="text-lg font-semibold text-brand-900">%{score}</span>
      </div>

      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-brand-50">
        <div
          className={`h-full rounded-full transition-all ${barColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {score === 100 ? (
        <p className="text-sm text-brand-500">Profiliniz eksiksiz — harika iş!</p>
      ) : (
        <>
          <p className="mb-2 text-sm text-brand-500">
            Profilinizi tamamlamak danışanların sizi bulma ve tercih etme olasılığını artırır.
          </p>
          <ul className="space-y-1.5">
            {missing.slice(0, 4).map((item) => (
              <li key={item.key} className="flex items-center gap-2 text-sm text-brand-700">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-300" />
                {item.label}
              </li>
            ))}
          </ul>
          <Link
            href="/panel/profil"
            className="mt-3 inline-block text-sm font-medium text-brand-600 hover:text-brand-800"
          >
            Profilimi düzenle →
          </Link>
        </>
      )}
    </Card>
  );
}
