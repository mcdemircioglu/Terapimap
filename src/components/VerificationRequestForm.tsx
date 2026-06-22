'use client';

import { useState, useRef } from 'react';

type RequestType = 'update' | 'photo_update' | 'removal' | '';

interface Props {
  professionalId: string;
  professionalName: string;
}

const REQUEST_TYPE_OPTIONS = [
  { value: 'update', label: 'Profilimi doğrulamak ve güncellemek istiyorum' },
  { value: 'photo_update', label: 'Profil fotoğrafı eklemek / güncellemek istiyorum' },
  { value: 'removal', label: 'Profilimin Terapimap\'ten kaldırılmasını istiyorum' },
];

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Input({
  value, onChange, type = 'text', placeholder, required, disabled,
}: {
  value: string; onChange: (v: string) => void; type?: string;
  placeholder?: string; required?: boolean; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition disabled:bg-gray-50 disabled:text-gray-400"
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 4, required }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; required?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      required={required}
      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition resize-y"
    />
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
      <h3 className="text-sm font-semibold text-brand-700 uppercase tracking-wider pb-2 border-b border-gray-100">
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function VerificationRequestForm({ professionalId, professionalName }: Props) {
  // ── State ──
  const [requestType, setRequestType] = useState<RequestType>('');
  const [fullName, setFullName] = useState(professionalName);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [offersOnline, setOffersOnline] = useState<boolean | null>(null);
  const [offersInPerson, setOffersInPerson] = useState<boolean | null>(null);
  const [specialties, setSpecialties] = useState('');
  const [bio, setBio] = useState('');
  const [message, setMessage] = useState('');

  // Photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isRemoval = requestType === 'removal';
  const showPhotoUpload = requestType === 'photo_update' || requestType === 'update';
  const showUpdateFields = requestType === 'update';

  // ── Photo handling ──
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhotoError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Sadece JPG, PNG ve WebP dosyaları kabul edilmektedir.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Dosya boyutu 5 MB\'ı geçemez.');
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!requestType) { setError('Lütfen bir talep tipi seçin.'); return; }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Geçerli bir e-posta adresi giriniz.'); return;
    }
    if (!phone.trim()) { setError('Telefon numarası zorunludur.'); return; }
    if (isRemoval && !message.trim()) {
      setError('Profil kaldırma talebinde ek açıklama zorunludur.'); return;
    }

    setSubmitting(true);

    try {
      // Step 1: upload photo if selected
      let photoUrl: string | null = null;
      if (photoFile && showPhotoUpload) {
        const fd = new FormData();
        fd.append('file', photoFile);
        fd.append('therapistId', professionalId);

        const upRes = await fetch('/api/verification-requests/upload', { method: 'POST', body: fd });
        const upData = await upRes.json();

        if (!upRes.ok) {
          setError(upData.error ?? 'Fotoğraf yüklenemedi.');
          setSubmitting(false);
          return;
        }
        photoUrl = upData.url;
      }

      // Step 2: submit the request
      const payload: Record<string, unknown> = {
        professional_id: professionalId,
        request_type: requestType,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        message: message.trim() || null,
      };

      if (photoUrl) payload.photo_url = photoUrl;

      if (showUpdateFields) {
        if (title) payload.title = title.trim();
        if (city) payload.city = city.trim();
        if (district) payload.district = district.trim();
        if (clinicName) payload.clinic_name = clinicName.trim();
        if (address) payload.address = address.trim();
        if (website) payload.website = website.trim();
        if (instagram) payload.instagram = instagram.trim();
        if (bio) payload.bio = bio.trim();
        if (offersOnline !== null) payload.offers_online = offersOnline;
        if (offersInPerson !== null) payload.offers_in_person = offersInPerson;
        if (specialties.trim()) {
          payload.specialties = specialties.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }

      const res = await fetch('/api/verification-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Bir hata oluştu. Lütfen tekrar deneyin.');
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success screen ──
  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-5">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">Talebiniz Alındı</h2>
        <p className="text-gray-600 leading-relaxed max-w-md mx-auto">
          {isRemoval
            ? 'Profil kaldırma talebiniz alınmıştır. İnceleme sonrası profiliniz yayından kaldırılacaktır.'
            : 'Talebiniz alınmıştır. Terapimap ekibi bilgilerinizi inceleyerek profilinizi güncelleyecektir.'}
        </p>
        <p className="mt-4 text-sm text-gray-400">
          Süreçle ilgili {email} adresine bildirim gönderilecektir.
        </p>
      </div>
    );
  }

  // ── Form ──
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Request type */}
      <Section title="Talep Tipi">
        <div className="space-y-3">
          {REQUEST_TYPE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                requestType === opt.value
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-gray-200 hover:border-brand-300 hover:bg-gray-50'
              } ${opt.value === 'removal' ? 'border-red-200 hover:border-red-400 hover:bg-red-50' + (requestType === 'removal' ? ' !border-red-500 !bg-red-50' : '') : ''}`}
            >
              <input
                type="radio"
                name="request_type"
                value={opt.value}
                checked={requestType === opt.value}
                onChange={() => setRequestType(opt.value as RequestType)}
                className="mt-0.5 flex-shrink-0 text-brand-600"
              />
              <span className={`text-sm font-medium ${opt.value === 'removal' ? 'text-red-700' : 'text-gray-800'}`}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </Section>

      {/* Removal warning */}
      {isRemoval && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <strong>Not:</strong> Bu talep, profilinizi Terapimap&apos;ten kaldırmak için bir inceleme süreci başlatır. Profiliniz, admin onayından sonra yayından kaldırılacaktır.
        </div>
      )}

      {requestType && (
        <>
          {/* Required info */}
          <Section title="İletişim Bilgileri">
            <div>
              <FieldLabel required>Ad Soyad</FieldLabel>
              <Input value={fullName} onChange={setFullName} placeholder="Ad Soyad" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel required>E-posta</FieldLabel>
                <Input type="email" value={email} onChange={setEmail} placeholder="ornek@email.com" required />
              </div>
              <div>
                <FieldLabel required>Telefon</FieldLabel>
                <Input type="tel" value={phone} onChange={setPhone} placeholder="+90 5XX XXX XX XX" required />
              </div>
            </div>
          </Section>

          {/* Photo upload */}
          {showPhotoUpload && (
            <Section title="Profil Fotoğrafı">
              <div>
                <p className="text-sm text-gray-500 mb-3">
                  JPG, PNG veya WebP formatında, maksimum 5 MB.
                </p>
                {photoPreview ? (
                  <div className="flex items-center gap-4">
                    <img src={photoPreview} alt="Önizleme" className="w-20 h-20 rounded-full object-cover border-2 border-brand-200" />
                    <button
                      type="button"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                      className="text-sm text-red-600 hover:text-red-800 underline"
                    >
                      Kaldır
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-brand-400 hover:text-brand-600 transition-colors w-full justify-center"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Fotoğraf seç
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
                {photoError && <p className="mt-2 text-sm text-red-600">{photoError}</p>}
              </div>
            </Section>
          )}

          {/* Optional profile update fields */}
          {showUpdateFields && (
            <>
              <Section title="Profil Bilgileri (Opsiyonel)">
                <p className="text-xs text-gray-400 -mt-1">Yalnızca değiştirmek istediğiniz alanları doldurun.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Ünvan</FieldLabel>
                    <Input value={title} onChange={setTitle} placeholder="Dr., Uzm. Psk." />
                  </div>
                  <div>
                    <FieldLabel>Şehir</FieldLabel>
                    <Input value={city} onChange={setCity} placeholder="İstanbul" />
                  </div>
                  <div>
                    <FieldLabel>İlçe</FieldLabel>
                    <Input value={district} onChange={setDistrict} placeholder="Kadıköy" />
                  </div>
                  <div>
                    <FieldLabel>Klinik / Kurum Adı</FieldLabel>
                    <Input value={clinicName} onChange={setClinicName} placeholder="Terapi Kliniği" />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Adres</FieldLabel>
                    <Input value={address} onChange={setAddress} placeholder="Tam adres" />
                  </div>
                  <div>
                    <FieldLabel>Web Sitesi</FieldLabel>
                    <Input value={website} onChange={setWebsite} placeholder="https://..." />
                  </div>
                  <div>
                    <FieldLabel>Instagram</FieldLabel>
                    <Input value={instagram} onChange={setInstagram} placeholder="https://instagram.com/..." />
                  </div>
                </div>
              </Section>

              <Section title="Seans Türü (Opsiyonel)">
                <div className="flex flex-wrap gap-4">
                  {[
                    { label: 'Online görüşme', field: 'online' as const },
                    { label: 'Yüz yüze görüşme', field: 'inPerson' as const },
                  ].map(({ label, field }) => {
                    const current = field === 'online' ? offersOnline : offersInPerson;
                    const setter = field === 'online' ? setOffersOnline : setOffersInPerson;
                    return (
                      <div key={field} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700">{label}:</span>
                        {[{ val: true, lbl: 'Evet' }, { val: false, lbl: 'Hayır' }].map(({ val, lbl }) => (
                          <label key={String(val)} className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name={field}
                              checked={current === val}
                              onChange={() => setter(val)}
                              className="text-brand-600"
                            />
                            <span className="text-sm">{lbl}</span>
                          </label>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </Section>

              <Section title="Uzmanlık Alanları (Opsiyonel)">
                <div>
                  <p className="text-xs text-gray-400 mb-2">Uzmanlık alanlarınızı virgülle ayırarak yazın.</p>
                  <Input
                    value={specialties}
                    onChange={setSpecialties}
                    placeholder="Anksiyete, Depresyon, Çift Terapisi"
                  />
                </div>
              </Section>

              <Section title="Hakkımda (Opsiyonel)">
                <Textarea
                  value={bio}
                  onChange={setBio}
                  placeholder="Kendinizi ve çalışma yönteminizi kısaca anlatın..."
                  rows={5}
                />
              </Section>
            </>
          )}

          {/* Message / note */}
          <Section title={isRemoval ? 'Kaldırma Gerekçesi' : 'Ek Açıklama (Opsiyonel)'}>
            <Textarea
              value={message}
              onChange={setMessage}
              placeholder={isRemoval ? 'Profilinizin neden kaldırılmasını istediğinizi açıklayın...' : 'Eklemek istediğiniz başka bir bilgi var mı?'}
              rows={4}
              required={isRemoval}
            />
          </Section>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 px-6 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
              isRemoval
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-brand-600 hover:bg-brand-700 text-white'
            }`}
          >
            {submitting ? 'Gönderiliyor…' : isRemoval ? 'Profil Kaldırma Talebi Gönder' : 'Talebi Gönder'}
          </button>

          <p className="text-xs text-center text-gray-400">
            Bilgileriniz yalnızca profil doğrulama sürecinde kullanılır ve üçüncü taraflarla paylaşılmaz.
          </p>
        </>
      )}
    </form>
  );
}
