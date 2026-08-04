'use client';

/**
 * Hero arama çubuğu — koyu tema, 4 alan (mockup düzeni):
 *  1) Konu (Örn: Anksiyete)         → 'konu' tipi uzmanlık
 *  2) Konum                          → şehir
 *  3) Uzmanlık / Yöntem              → 'yontem' tipi uzmanlık
 *  4) Görüşme türü                   → online / yüz yüze
 * Seçime göre SEO landing sayfasına yönlendirir.
 */
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { CITIES } from '@/lib/cities';
import { groupSpecialties } from '@/types/database';
import type { Specialty } from '@/types/database';

const T = {
  tr: {
    l1: 'Size nasıl yardımcı olabilir?', p1: 'Örn: Anksiyete, Depresyon',
    l2: 'Konum', p2: 'Şehir seçin',
    l3: 'Uzmanlık alanı', p3: 'Tercihinizi seçin',
    l4: 'Görüşme türü', p4: 'Online, Yüz yüze vb.',
    online: 'Online', inperson: 'Yüz yüze', cta: 'Terapistleri ara',
  },
  en: {
    l1: 'How can we help?', p1: 'e.g. Anxiety, Depression',
    l2: 'Location', p2: 'Select city',
    l3: 'Specialty', p3: 'Choose',
    l4: 'Session type', p4: 'Online, In-person',
    online: 'Online', inperson: 'In-person', cta: 'Find therapists',
  },
} as const;

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
const IC = {
  help: 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01',
  pin: 'M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0zM12 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  spark: 'M12 3v4M12 17v4M5 12H1M23 12h-4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6',
  video: 'M23 7l-7 5 7 5V7zM1 5h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H1z',
};

export default function HeroSearch({
  locale,
  specialties,
}: {
  locale: string;
  specialties: Specialty[];
}) {
  const t = locale === 'en' ? T.en : T.tr;
  const router = useRouter();

  const { konu, yontem } = useMemo(() => {
    const groups = groupSpecialties(specialties);
    const find = (type: string) => groups.find((g) => g.type === type)?.items ?? [];
    return { konu: find('konu'), yontem: [...find('yontem'), ...find('kitle')] };
  }, [specialties]);

  const [topic, setTopic] = useState('');
  const [city, setCity] = useState('');
  const [method, setMethod] = useState('');
  const [meeting, setMeeting] = useState('');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const listBase = locale === 'tr' ? 'terapistler' : 'therapists';
    const specialty = topic || method; // konu önceliklidir
    let path: string;
    if (city && specialty) path = `/${locale}/${listBase}/${city}/${specialty}`;
    else if (city) path = `/${locale}/${listBase}/${city}`;
    else if (specialty) path = `/${locale}/${specialty}`;
    else path = `/${locale}/${listBase}`;

    const qs: string[] = [];
    if (meeting === 'online') qs.push('online=1');
    else if (meeting === 'inperson') qs.push('inPerson=1');
    if (qs.length) path += (path.includes('?') ? '&' : '?') + qs.join('&');

    router.push(path);
  }

  const selCls =
    'h-11 w-full appearance-none rounded-lg border border-white/10 bg-brand-950/50 pl-9 pr-8 text-sm text-white ' +
    'focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/10 ' +
    '[&>option]:bg-white [&>option]:text-brand-950';

  const Field = ({
    label, icon, children,
  }: { label: string; icon: string; children: React.ReactNode }) => (
    <div>
      <label className="mb-1.5 block text-[11px] font-medium text-brand-100/70">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-300">
          <Icon d={icon} />
        </span>
        {children}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-300">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" clipRule="evenodd" /></svg>
        </span>
      </div>
    </div>
  );

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-white/10 bg-brand-900/60 p-3 shadow-soft backdrop-blur-md sm:p-4"
    >
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end">
        <Field label={t.l1} icon={IC.help}>
          <select value={topic} onChange={(e) => setTopic(e.target.value)} className={selCls} aria-label={t.l1}>
            <option value="">{t.p1}</option>
            {konu.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        </Field>
        <Field label={t.l2} icon={IC.pin}>
          <select value={city} onChange={(e) => setCity(e.target.value)} className={selCls} aria-label={t.l2}>
            <option value="">{t.p2}</option>
            {CITIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        </Field>
        <Field label={t.l3} icon={IC.spark}>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className={selCls} aria-label={t.l3}>
            <option value="">{t.p3}</option>
            {yontem.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        </Field>
        <Field label={t.l4} icon={IC.video}>
          <select value={meeting} onChange={(e) => setMeeting(e.target.value)} className={selCls} aria-label={t.l4}>
            <option value="">{t.p4}</option>
            <option value="online">{t.online}</option>
            <option value="inperson">{t.inperson}</option>
          </select>
        </Field>
        <button
          type="submit"
          className="mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#7ee6cf] px-6 text-sm font-semibold text-brand-950 transition-colors hover:bg-[#6ed9c0] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 lg:mt-0"
        >
          {t.cta}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
      </div>
    </form>
  );
}
