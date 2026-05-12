'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = { href: string; label: string };

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export default function MobileMenu({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll while menu is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Hamburger button — hidden on md+ */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
        aria-expanded={open}
        aria-controls="mobile-nav"
        className="grid h-9 w-9 place-items-center rounded-lg text-brand-700 hover:bg-brand-50 md:hidden"
      >
        {open ? <XIcon /> : <MenuIcon />}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/10 md:hidden"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-down panel */}
      <nav
        id="mobile-nav"
        aria-label="Mobil menü"
        className={[
          'fixed inset-x-0 top-16 z-30 border-b border-brand-100 bg-white shadow-lg transition-all duration-200 ease-out md:hidden',
          open ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0',
        ].join(' ')}
      >
        <ul className="divide-y divide-brand-50 px-4 py-1">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center py-4 text-sm font-medium text-brand-800 hover:text-brand-600"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
