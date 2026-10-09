'use client';

/**
 * "Kayıt Ol" formu — /duyurular sayfasındaki bir duyuru kartına tıklayınca
 * modalda açılır. ReviewForm ile aynı desen. Gönderim admin onayı
 * GEREKTIRMEZ — doğrudan /api/announcements/[id]/register üzerinden
 * duyuruyu yayınlayan terapistin panelinde görünür (reviews/leads'ten
 * farklı bir akış — bkz. announcements_migration.sql).
 */
import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';

import { Honeypot, readHoneypot } from '@/components/Honeypot';
type Status = 'idle' | 'loading' | 'success' | 'error';

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-7 w-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SuccessPanel() {
  const t = useTranslations('announcement');
  return (
    <div className="flex flex-col items-center gap-5 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 text-accent-700">
        <CheckIcon />
      </div>
      <div>
        <p className="text-base font-semibold text-brand-900">{t('successTitle')}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-brand-600">{t('success')}</p>
      </div>
    </div>
  );
}

export default function RegisterForm({ announcementId }: { announcementId: string }) {
  const t = useTranslations('announcement');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const isLoading = status === 'loading';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const hp = readHoneypot(e.currentTarget as Element);
    setErrorMsg(null);

    const data = new FormData(e.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const phone = String(data.get('phone') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();

    if (!name || !email) {
      setStatus('error');
      setErrorMsg(t('validation'));
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch(`/api/announcements/${announcementId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: phone || null, message: message || null, hp_company: hp }),
      });
      if (!res.ok) throw new Error('failed');
      formRef.current?.reset();
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMsg(t('error'));
    }
  }

  if (status === 'success') {
    return <SuccessPanel />;
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate>
      <Honeypot />
      <fieldset
        disabled={isLoading}
        className="space-y-4 transition-opacity disabled:pointer-events-none disabled:opacity-50"
      >
        <div>
          <label className="mb-1.5 block text-xs font-medium text-brand-700">
            {t('name')} <span className="text-red-400" aria-hidden>*</span>
          </label>
          <Input name="name" required autoComplete="name" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-brand-700">
            {t('email')} <span className="text-red-400" aria-hidden>*</span>
          </label>
          <Input name="email" type="email" required autoComplete="email" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-brand-700">{t('phone')}</label>
          <Input name="phone" type="tel" autoComplete="tel" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-brand-700">{t('message')}</label>
          <Textarea name="message" />
        </div>
      </fieldset>

      {status === 'error' && errorMsg && (
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
          <WarningIcon />
          <span>{errorMsg}</span>
        </div>
      )}

      <Button type="submit" disabled={isLoading} className="mt-4 w-full">
        {isLoading ? (
          <>
            <Spinner />
            {t('sending')}
          </>
        ) : (
          t('submit')
        )}
      </Button>
    </form>
  );
}
