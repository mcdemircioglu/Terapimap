import * as React from 'react';
import { cn } from '@/lib/utils';

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'h-11 w-full appearance-none rounded-lg border border-brand-200 bg-white px-3 pr-9 text-sm text-brand-900',
      'focus:border-brand-400',
      'bg-[url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 20 20%27 fill=%27%23316c6f%27><path fill-rule=%27evenodd%27 d=%27M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z%27 clip-rule=%27evenodd%27/></svg>")] bg-[length:18px_18px] bg-[position:right_10px_center] bg-no-repeat',
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';
