'use client';

import { useEffect, useState } from 'react';
import { useCookieConsent } from './CookieConsentProvider';

/** Aç/kapat anahtarı */
function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-brand-600' : 'bg-gray-300'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function CategoryRow({
  title,
  description,
  checked,
  onChange,
  locked,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  locked?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-900">
            {title}
            {locked && (
              <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700 border border-brand-200">
                Her zaman aktif
              </span>
            )}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">{description}</p>
        </div>
        <Toggle checked={checked} onChange={onChange} disabled={locked} label={title} />
      </div>
    </div>
  );
}

/**
 * Çerez tercih modalı — kategori bazında izin yönetimi.
 */
export default function CookiePreferencesModal() {
  const { isModalOpen, closeModal, consent, savePreferences, acceptAll, rejectAll } =
    useCookieConsent();

  const [analytics, setAnalytics] = useState(consent.analytics);
  const [marketing, setMarketing] = useState(consent.marketing);

  // Modal her açıldığında mevcut tercihi yansıt.
  useEffect(() => {
    if (isModalOpen) {
      setAnalytics(consent.analytics);
      setMarketing(consent.marketing);
    }
  }, [isModalOpen, consent.analytics, consent.marketing]);

  // Modal açıkken arka plan kaydırmayı kilitle.
  useEffect(() => {
    if (!isModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isModalOpen]);

  if (!isModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={closeModal}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Çerez tercihleri"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-brand-900">Çerez Tercihleri</h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              Hangi çerez kategorilerine izin verdiğinizi seçin. Tercihlerinizi
              dilediğiniz zaman bu ekrandan değiştirebilirsiniz.
            </p>
          </div>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Kapat"
            className="rounded-lg p-1 text-2xl leading-none text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <CategoryRow
            title="Zorunlu Çerezler"
            description="Sitenin çalışması için gereklidir; oturum yönetimi, güvenlik ve dil tercihi gibi temel işlevleri sağlar. Kapatılamaz."
            checked
            locked
          />
          <CategoryRow
            title="Analitik Çerezler"
            description="Sitenin nasıl kullanıldığını anlamamıza ve deneyimi iyileştirmemize yardımcı olur (ör. Google Analytics). Yalnızca izin verirseniz çalışır."
            checked={analytics}
            onChange={setAnalytics}
          />
          <CategoryRow
            title="Pazarlama Çerezleri"
            description="Reklam ve yeniden pazarlama amaçlı çerezlerdir (ör. Meta Pixel). Yalnızca izin verirseniz çalışır."
            checked={marketing}
            onChange={setMarketing}
          />
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={rejectAll}
            className="flex-1 rounded-xl border border-brand-300 bg-white px-4 py-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
          >
            Tümünü Reddet
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="flex-1 rounded-xl border border-brand-300 bg-white px-4 py-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
          >
            Tümünü Kabul Et
          </button>
          <button
            type="button"
            onClick={() => savePreferences({ analytics, marketing })}
            className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Tercihlerimi Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
