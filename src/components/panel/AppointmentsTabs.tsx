import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * "Randevularım" ve "Müsaitlik Ayarları" sayfaları arasında basit sekme
 * gezinmesi. Her iki sayfa da /panel/randevular altında ayrı route'lar
 * olduğu için (nested layout yerine) bu küçük bileşen ikisinde de tekrar
 * kullanılıyor.
 */
export function AppointmentsTabs({ active }: { active: 'list' | 'availability' }) {
  const tabs = [
    { key: 'list' as const, href: '/panel/randevular', label: 'Randevularım' },
    { key: 'availability' as const, href: '/panel/randevular/musaitlik', label: 'Müsaitlik Ayarları' },
  ];

  return (
    <div className="flex gap-1 border-b border-brand-100">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={cn(
            'px-4 py-2.5 text-sm font-medium transition-colors',
            active === tab.key
              ? 'border-b-2 border-brand-600 text-brand-900'
              : 'text-brand-500 hover:text-brand-800',
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
