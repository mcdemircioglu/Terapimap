'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { StarIcon } from '../ui/icons';

type Status = 'idle' | 'loading' | 'success' | 'error';

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Star rating picker
// ---------------------------------------------------------------------------

function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Puan">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} / 5`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
        >
          <StarIcon
            className={`h-7 w-7 ${star <= display ? 'text-accent-500' : 'text-brand-100'}`}
          />
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Success panel
// ---------------------------------------------------------------------------

function SuccessPanel({ onReset }: { onReset: () => void }) {
  const t = useTranslations('review');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={[
        'flex flex-col items-center gap-5 py-8 text-center transition-all duration-500',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
      ].join(' ')}
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span
          className="absolute inset-0 animate-ping rounded-full bg-accent-200 opacity-75"
          style={{ animationIterationCount: 1, animationDuration: '0.7s' }}
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 text-accent-700">
          <CheckIcon />
        </div>
      </div>

      <div>
        <p className="text-base font-semibold text-brand-900">{t('successTitle')}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-brand-600">{t('success')}</p>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="text-xs font-medium text-brand-500 underline-offset-2 hover:text-brand-700 hover:underline"
      >
        {t('title')}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review form
// ---------------------------------------------------------------------------

export default function ReviewForm({ professionalId }: { professionalId: string }) {
  const t = useTranslations('review');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const isLoading = status === 'loading';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);

    const data = new FormData(e.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const comment = String(data.get('comment') ?? '').trim();

    if (!name || !email || !comment || rating < 1) {
      setStatus('error');
      setErrorMsg(t('validation'));
      return;
    }
    if (comment.length < 10) {
      setStatus('error');
      setErrorMsg(t('commentTooShort'));
      return;
    }

    setStatus('loading');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          professional_id: professionalId,
          name,
          email,
          comment,
          rating,
          is_anonymous: isAnonymous,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        if (d?.error === 'duplicate') {
          setStatus('error');
          setErrorMsg(t('duplicateError'));
          return;
        }
        throw new Error('failed');
      }
      formRef.current?.reset();
      setRating(0);
      setIsAnonymous(false);
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMsg(t('error'));
    }
  }

  if (status === 'success') {
    return <SuccessPanel onReset={() => setStatus('idle')} />;
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate>
      <fieldset
        disabled={isLoading}
        className="space-y-4 transition-opacity disabled:pointer-events-none disabled:opacity-50"
      >
        <div>
          <label className="mb-1.5 block text-xs font-medium text-brand-700">
            {t('ratingLabel')} <span className="text-red-400" aria-hidden>*</span>
          </label>
          <StarRatingInput value={rating} onChange={setRating} />
        </div>

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
          <p className="mt-1 text-[11px] text-brand-400">{t('emailHint')}</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-brand-700">
            {t('comment')} <span className="text-red-400" aria-hidden>*</span>
          </label>
          <Textarea name="comment" required placeholder={t('commentPlaceholder')} />
        </div>

        <label className="flex items-center gap-2 text-sm text-brand-700">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-400"
          />
          {t('anonymous')}
        </label>
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
