/**
 * Lucide ikon seti — inline SVG olarak.
 * Kod tabanı zaten inline SVG kullandığı için ayrı bir ikon bağımlılığı
 * eklemek yerine Lucide path verilerini (ISC lisanslı) burada topluyoruz.
 * Server ve client component'lerde güvenle kullanılabilir.
 */
import type { SVGProps } from 'react';

export type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps, children: React.ReactNode) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </>,
  );
}

export function NavigationIcon(props: IconProps) {
  return base(props, <polygon points="3 11 22 2 13 21 11 13 3 11" />);
}

export function CheckIcon(props: IconProps) {
  return base(props, <path d="M20 6 9 17l-5-5" />);
}

export function GlobeIcon(props: IconProps) {
  return base(
    props,
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </>,
  );
}

export function VideoIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
      <rect x="2" y="6" width="14" height="12" rx="2" />
    </>,
  );
}

export function Building2Icon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </>,
  );
}

export function StethoscopeIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M11 2v2" />
      <path d="M5 2v2" />
      <path d="M5 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-1" />
      <path d="M8 15a6 6 0 0 0 12 0v-3" />
      <circle cx="20" cy="10" r="2" />
    </>,
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </>,
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </>,
  );
}

export function HeartIcon(props: IconProps) {
  return base(
    props,
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />,
  );
}

export function UsersIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>,
  );
}

export function CloudIcon(props: IconProps) {
  return base(
    props,
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />,
  );
}

export function EyeIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </>,
  );
}

export function SmileIcon(props: IconProps) {
  return base(
    props,
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" x2="9.01" y1="9" y2="9" />
      <line x1="15" x2="15.01" y1="9" y2="9" />
    </>,
  );
}

export function SearchIcon(props: IconProps) {
  return base(
    props,
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>,
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </>,
  );
}

export function InstagramIcon(props: IconProps) {
  return base(
    props,
    <>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </>,
  );
}

export function CalendarPlusIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M16 19h6" />
      <path d="M19 16v6" />
      <path d="M21 12.598V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8.5" />
      <path d="M3 10h18" />
      <path d="M8 2v4" />
      <path d="M16 2v4" />
    </>,
  );
}

export function XIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>,
  );
}

export function MapIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />
      <path d="M15 5.764v15" />
      <path d="M9 3.236v15" />
    </>,
  );
}

/* ── Panel (Faz 1 / Adım 3) için eklenen ikonlar ──────────────────────── */

export function HomeIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </>,
  );
}

export function UserCircleIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>,
  );
}

export function InboxIcon(props: IconProps) {
  return base(
    props,
    <>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </>,
  );
}

export function CalendarIcon(props: IconProps) {
  return base(
    props,
    <>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </>,
  );
}

export function BarChartIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M3 3v18h18" />
      <rect width="4" height="7" x="7" y="10" />
      <rect width="4" height="12" x="15" y="5" />
    </>,
  );
}

export function SettingsIcon(props: IconProps) {
  return base(
    props,
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 10v6m11-7h-6M7 12H1m15.5-6.5-4.24 4.24m-6.52 0L1.5 5.5m0 13 4.24-4.24m6.52 0 4.24 4.24" />
    </>,
  );
}

export function MenuIcon(props: IconProps) {
  return base(
    props,
    <>
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </>,
  );
}

export function LogOutIcon(props: IconProps) {
  return base(
    props,
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </>,
  );
}
