import { cn } from '@/lib/utils';

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-brand-100 bg-white shadow-soft',
        className,
      )}
    >
      {children}
    </div>
  );
}
