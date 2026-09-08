'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getBrowserClient } from '@/lib/supabase/client';
import { PANEL_FEATURES, PANEL_NAV_ITEMS, type PanelNavItem } from '@/lib/panel/features';
import {
  HomeIcon,
  UserCircleIcon,
  InboxIcon,
  CalendarIcon,
  BarChartIcon,
  SettingsIcon,
  GlobeIcon,
  MenuIcon,
  LogOutIcon,
  XIcon,
} from '@/components/ui/icons';

const ICONS: Record<PanelNavItem['icon'], React.ComponentType<{ className?: string }>> = {
  home: HomeIcon,
  user: UserCircleIcon,
  inbox: InboxIcon,
  calendar: CalendarIcon,
  chart: BarChartIcon,
  globe: GlobeIcon,
  settings: SettingsIcon,
};

type PanelProfessional = {
  id: string;
  name: string;
  city: string | null;
  status: string | null;
  is_verified: boolean;
};

function NavLink({ item, active }: { item: PanelNavItem; active: boolean }) {
  const Icon = ICONS[item.icon];
  const enabled = PANEL_FEATURES[item.key];

  if (!enabled) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-brand-300">
        <span className="flex items-center gap-3">
          <Icon className="h-4 w-4" />
          {item.label}
        </span>
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-400">
          Yakında
        </span>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-brand-600 text-white'
          : 'text-brand-700 hover:bg-brand-50'
      }`}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-col gap-1 p-3">
      {PANEL_NAV_ITEMS.map((item) => (
        <NavLink key={item.key} item={item} active={pathname === item.href} />
      ))}
    </nav>
  );
}

export function PanelShell({
  professional,
  children,
}: {
  professional: PanelProfessional | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = getBrowserClient();
    await supabase.auth.signOut();
    router.push('/panel/giris');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-brand-100 bg-white px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-brand-600 hover:bg-brand-50 md:hidden"
            aria-label="Menüyü aç"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-brand-900">Terapimap Panel</span>
        </div>

        <div className="flex items-center gap-3">
          {professional && (
            <span className="hidden text-sm text-brand-600 sm:inline">
              {professional.name}
            </span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-brand-500 hover:bg-brand-50 hover:text-brand-800"
          >
            <LogOutIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Çıkış yap</span>
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl">
        {/* Desktop sidebar */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 border-r border-brand-100 bg-white md:block">
          <SidebarContent pathname={pathname} />
        </aside>

        {/* Mobile sidebar (overlay) */}
        {mobileOpen && (
          <div className="fixed inset-0 z-30 md:hidden">
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-64 bg-white shadow-lg">
              <div className="flex h-14 items-center justify-between border-b border-brand-100 px-4">
                <span className="text-sm font-semibold text-brand-900">Terapimap Panel</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 text-brand-500 hover:bg-brand-50"
                  aria-label="Menüyü kapat"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
              <div onClick={() => setMobileOpen(false)}>
                <SidebarContent pathname={pathname} />
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
