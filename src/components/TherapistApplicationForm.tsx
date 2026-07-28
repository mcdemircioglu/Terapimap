'use client';

/**
 * "Uzman Üye Ol" — terapist başvuru formu.
 * request_type: 'new' ile /api/verification-requests'e gönderir.
 * Bilgiler bekleyen başvuru olarak kaydolur; admin onaylayınca yayınlanır.
 */
import { useState } from 'react';
import { Button } from './ui/Button';
import { Input, Textarea } from './ui/Input';
import { Select } from './ui/Select';
import { CITIES } from '@/lib/cities';
import { getDistricts } from '@/lib/districts';
import {
  PROFESSIONAL_TYPE_LABELS,
  SPECIALTY_TYPE_LABELS,
  groupSpecialties,
} from '@/types/database';
import type { ProfessionalType, Specialty } from '@/types/database';

type Status = 'idle' | 'loading' | 'success' | 'error';

const PROF_TYPES: ProfessionalType[] = [
  'psychologist',
  'clinical_psychologist',
  'psychiatrist',
  'family_therapist',
  'counselor',
];

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-brand-700">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-brand-500">{hint}</p>}
    </div>
  );
}

export default function TherapistApplicationForm({
  specialtyOptions,
}: {
  specialtyOptions: Specialty[];
}) {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profType, setProfType] = useState<ProfessionalType | ''>('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [online, setOnline] = useState(false);
  const [inPerson, setInPerson] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [kvkk, setKvkk] = useState(false);

  const districts = city ? getDistricts(city) : [];
  const isLoading = status === 'loading';

  const toggleSpecialty = (name: string) =>
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );

  const cityName = (slug: string) => CITIES.find((c) => c.slug === slug)?.name ?? slug;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!firstName.trim() || !lastName.trim()) return fail('Ad ve soyad zorunludur.');
    if (!profType) return fail('Unvan seçiniz.');
    if (!city) return fail('Şehir seçiniz.');
    if (!district) return fail('İlçe seçiniz.');
    if (!phone.trim()) return fail('Telefon zorunludur.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return fail('Geçerli bir e-posta giriniz.');
    if (!bio.trim()) return fail('Hakkında alanı zorunludur.');
    if (selected.length === 0) return fail('En az bir uzmanlık alanı seçiniz.');
    if (!kvkk) return fail('Devam etmek için onay kutusunu işaretleyiniz.');

    setStatus('loading');
    try {
      const res = await fetch('/api/verification-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_type: 'new',
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          professional_type: profType,
          title: PROFESSIONAL_TYPE_LABELS[profType],
          city: cityName(city),
          district: district.trim(),
          phone: phone.trim(),
          email: email.trim(),
          bio: bio.trim(),
          website: website.trim() || undefined,
          instagram: instagram.trim() || undefined,
          google_maps_url: googleMapsUrl.trim() || undefined,
          offers_online: online,
          offers_in_person: inPerson,
          specialties: selected,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return fail(data.error ?? 'Başvuru gönderilemedi.');
      setStatus('success');
    } catch {
      fail('Bağlantı hatası. Lütfen tekrar deneyin.');
    }
  }

  function fail(msg: string) {
    setErrorMsg(msg);
    setStatus('error');
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-accent-200 bg-accent-50 p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-100 text-accent-700">
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold text-brand-900">Başvurunuz alındı</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-brand-600">
          Ekibimiz başvurunuzu inceleyecek. Onaylandığında profiliniz Terapimap&apos;te
          yayına alınacak ve size e-posta ile bilgi verilecektir.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <fieldset disabled={isLoading} className="space-y-6 disabled:opacity-60">
        {/* Kişisel */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ad" required>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
          </Field>
          <Field label="Soyad" required>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
          </Field>
        </div>

        <Field label="Unvan" required>
          <Select value={profType} onChange={(e) => setProfType(e.target.value as ProfessionalType)}>
            <option value="">Seçiniz</option>
            {PROF_TYPES.map((t) => (
              <option key={t} value={t}>{PROFESSIONAL_TYPE_LABELS[t]}</option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Şehir" required>
            <Select
              value={city}
              onChange={(e) => { setCity(e.target.value); setDistrict(''); }}
            >
              <option value="">Seçiniz</option>
              {CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="İlçe" required>
            <Select value={district} onChange={(e) => setDistrict(e.target.value)} disabled={!city}>
              <option value="">{city ? 'Seçiniz' : 'Önce şehir seçin'}</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefon" required>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="05XX XXX XX XX" />
          </Field>
          <Field label="E-posta" required>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="ornek@eposta.com" />
          </Field>
        </div>

        {/* Görüşme türü */}
        <Field label="Görüşme türü">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-brand-700">
              <input type="checkbox" checked={inPerson} onChange={(e) => setInPerson(e.target.checked)} className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-400" />
              Yüz yüze görüşme
            </label>
            <label className="flex items-center gap-2 text-sm text-brand-700">
              <input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-400" />
              Online görüşme
            </label>
          </div>
        </Field>

        {/* Uzmanlıklar */}
        <Field label="Uzmanlık alanları" required hint="En az bir alan seçmelisiniz.">
          <div className="space-y-4">
            {groupSpecialties(specialtyOptions).map((group) => (
              <div key={group.type}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-brand-500">
                  {SPECIALTY_TYPE_LABELS[group.type].form}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {group.items.map((s) => {
                    const on = selected.includes(s.name);
                    return (
                      <label
                        key={s.id}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition-colors ${
                          on
                            ? 'border-brand-500 bg-brand-50 text-brand-800'
                            : 'border-brand-200 text-brand-700 hover:border-brand-300 hover:bg-brand-50'
                        }`}
                      >
                        <input type="checkbox" checked={on} onChange={() => toggleSpecialty(s.name)} className="h-4 w-4 rounded text-brand-600 focus:ring-brand-400" />
                        {s.name}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {selected.length > 0 && (
            <p className="mt-2 text-xs text-brand-600">{selected.length} alan seçildi</p>
          )}
        </Field>

        {/* Hakkında */}
        <Field label="Hakkında" required hint="Eğitiminiz, yaklaşımınız ve çalışma alanlarınız hakkında kısa bir metin.">
          <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5} />
        </Field>

        {/* İsteğe bağlı bağlantılar */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Website (opsiyonel)">
            <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
          </Field>
          <Field label="Instagram (opsiyonel)">
            <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." />
          </Field>
        </div>

        <Field
          label="Google Haritalar bağlantısı (opsiyonel)"
          hint="Ofisinizin Google Haritalar linki. Yüz yüze görüşme yapıyorsanız profilinizde harita olarak gösterilir."
        >
          <Input
            type="url"
            value={googleMapsUrl}
            onChange={(e) => setGoogleMapsUrl(e.target.value)}
            placeholder="https://maps.app.goo.gl/... veya https://www.google.com/maps/place/..."
          />
        </Field>

        <label className="flex items-start gap-2.5 text-xs leading-relaxed text-brand-600">
          <input type="checkbox" checked={kvkk} onChange={(e) => setKvkk(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-400" />
          Verdiğim bilgilerin doğru olduğunu ve Terapimap tarafından profil oluşturma amacıyla
          işlenmesini kabul ediyorum.
        </label>
      </fieldset>

      {status === 'error' && errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <Button type="submit" size="lg" disabled={isLoading} className="w-full sm:w-auto">
        {isLoading ? 'Gönderiliyor…' : 'Başvuruyu Gönder'}
      </Button>
    </form>
  );
}
