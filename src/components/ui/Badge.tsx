import { cn } from '@/lib/utils';

type Variant = 'default' | 'brand' | 'accent' | 'soft';

const variants: Record<Variant, string> = {
  default: 'bg-brand-50 text-brand-700 border-brand-100',
  brand:   'bg-brand-100 text-brand-800 border-brand-200',
  accent:  'bg-accent-100 text-accent-800 border-accent-200',
  soft:    'bg-white text-brand-700 border-brand-200',
};

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
