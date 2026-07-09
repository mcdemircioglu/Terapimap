'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

/**
 * KVKK uyumlu çerez izin yönetimi.
 * Tercihler localStorage'da saklanır; tercih verilmeden analitik ve
 * pazarlama scriptleri YÜKLENMEZ (opt-in).
 */

export type CookieConsent = {
  /** Zorunlu çerezler — her zaman aktif, kapatılamaz. */
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

type StoredConsent = {
  version: number;
  updatedAt: string;
  consent: CookieConsent;
};

type CookieConsentContextValue = {
  /** Kullanıcının mevcut tercihi; henüz seçim yapılmadıysa her şey kapalı. */
  consent: CookieConsent;
  /** Kullanıcı daha önce bir seçim yaptı mı? (banner gösterimi için) */
  hasChoice: boolean;
  /** localStorage okunup state hazır mı? (SSR/hydration uyumu için) */
  isReady: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (prefs: { analytics: boolean; marketing: boolean }) => void;
};

const STORAGE_KEY = 'terapimap_cookie_consent';
const CONSENT_VERSION = 1;

const DEFAULT_CONSENT: CookieConsent = {
  necessary: true,
  analytics: false,
  marketing: false,
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

function readStoredConsent(): StoredConsent | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredConsent;
    // Sürüm değiştiyse (politika güncellendiyse) tercihi geçersiz say → banner yeniden çıkar.
    if (parsed?.version !== CONSENT_VERSION || !parsed?.consent) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredConsent(consent: CookieConsent) {
  try {
    const stored: StoredConsent = {
      version: CONSENT_VERSION,
      updatedAt: new Date().toISOString(),
      consent,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // localStorage kullanılamıyorsa (ör. gizli mod kısıtı) sessizce geç.
  }
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent>(DEFAULT_CONSENT);
  const [hasChoice, setHasChoice] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // İlk yüklemede kayıtlı tercihi oku (yalnızca client'ta çalışır).
  useEffect(() => {
    const stored = readStoredConsent();
    if (stored) {
      setConsent({ ...stored.consent, necessary: true });
      setHasChoice(true);
    }
    setIsReady(true);
  }, []);

  const persist = useCallback((next: CookieConsent) => {
    setConsent(next);
    setHasChoice(true);
    writeStoredConsent(next);
  }, []);

  const acceptAll = useCallback(() => {
    persist({ necessary: true, analytics: true, marketing: true });
    setIsModalOpen(false);
  }, [persist]);

  const rejectAll = useCallback(() => {
    persist({ necessary: true, analytics: false, marketing: false });
    setIsModalOpen(false);
  }, [persist]);

  const savePreferences = useCallback(
    (prefs: { analytics: boolean; marketing: boolean }) => {
      persist({ necessary: true, ...prefs });
      setIsModalOpen(false);
    },
    [persist],
  );

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  return (
    <CookieConsentContext.Provider
      value={{
        consent,
        hasChoice,
        isReady,
        isModalOpen,
        openModal,
        closeModal,
        acceptAll,
        rejectAll,
        savePreferences,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error('useCookieConsent, CookieConsentProvider içinde kullanılmalıdır.');
  }
  return ctx;
}
