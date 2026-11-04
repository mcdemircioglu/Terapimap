import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300',
  // accent-500 üzerinde beyaz yazı 4,24:1'di (AA için 4,5:1 gerekir); bir kademe koyulaştırıldı
  secondary:
    'bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800 disabled:bg-accent-300',
  ghost:
    'bg-transparent text-brand-700 hover:bg-brand-50',
  outline:
    'border border-brand-200 bg-white text-brand-800 hover:bg-brand-50',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

/**
 * Düğme görünümlü bağlantılar için sınıf üretici (bkz. ButtonLink). `<Link><Button/></Link>`
 * iç içe etkileşimli öğe oluşturuyordu (geçersiz HTML, bağlantı kutusu düğmeden küçük).
 */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed',
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
