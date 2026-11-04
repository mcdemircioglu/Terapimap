import Link from 'next/link';
import { buttonClasses } from './Button';

type ButtonLinkProps = Omit<React.ComponentProps<typeof Link>, 'className'> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

/** Düğme görünümlü tek bir bağlantı (`<a>`); içinde `<button>` yok. */
export default function ButtonLink({ variant, size, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...rest}>
      {children}
    </Link>
  );
}
