'use client';

import { useCookieConsent } from './CookieConsentProvider';

/** Footer'da kullanılan "Çerez Tercihlerimi Yönet" tetikleyicisi. */
export default function ManageCookiesLink({ label }: { label: string }) {
  const { openModal } = useCookieConsent();

  return (
    <button
      type="button"
      onClick={openModal}
      className="text-left hover:text-brand-900"
    >
      {label}
    </button>
  );
}
