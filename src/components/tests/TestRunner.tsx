'use client';

/**
 * TestRunner — psikoloji testlerinin ortak interaktif motoru.
 * DB'deki `psychology_tests.questions` / `scoring` verisiyle veri odaklı
 * çalışır; her yeni test için yeni bir bileşen yazmaya gerek kalmaz.
 *
 * Akış: tanıtım → soru soru (tek soru/ekran) → sonuç (skor + kademe) →
 * opsiyonel "sonucumu e-postama gönder" formu. Sonuç önce her zaman
 * gösterilir; e-posta girilmeden hiçbir veri sunucuya gönderilmez.
 */
import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckIcon, ShieldCheckIcon, ArrowUpRightIcon } from '@/components/ui/icons';
import { scoreTier } from '@/types/database';
import type { PsychologyTest } from '@/types/database';

type Props = {
  test: PsychologyTest;
  locale: string;
};

type Step = 'intro' | 'question' | 'result';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function TestRunner({ test, locale }: Props) {
  const tr = locale === 'tr';
  const [step, setStep] = useState<Step>('intro');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);

  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const questions = test.questions;
  const currentQuestion = questions[index];

  const score = Object.values(answers).reduce((sum, v) => sum + v, 0);
  const tier = step === 'result' ? scoreTier(test.scoring, score) : null;

  const therapistsHref = test.specialty?.slug ? `/${locale}/${test.specialty.slug}` : `/${locale}/${tr ? 'terapistler' : 'therapists'}`;
  const therapistsLabel = test.specialty
    ? tr
      ? `${test.specialty.name} alanında uzman bul`
      : `Find specialists in ${test.specialty.name}`
    : tr
      ? 'Uzman terapistleri gör'
      : 'View specialist therapists';

  function selectAnswer(value: number) {
    const nextAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(nextAnswers);
    if (index + 1 < questions.length) {
      setIndex(index + 1);
    } else {
      setStep('result');
    }
  }

  function goBack() {
    if (index === 0) {
      setStep('intro');
      return;
    }
    setIndex(index - 1);
  }

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email) || !consent || !tier) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/testler/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testSlug: test.slug,
          score,
          email,
          consentMarketing: consent,
        }),
      });
      if (!res.ok) throw new Error('request_failed');
      setSubmitted(true);
    } catch {
      setSubmitError(
        tr ? 'Bir şeyler ters gitti, lütfen tekrar deneyin.' : 'Something went wrong, please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Tanıtım ────────────────────────────────────────────────────────
  if (step === 'intro') {
    return (
      <Card className="p-6 md:p-8">
        {test.source_label && (
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            <ShieldCheckIcon className="h-3.5 w-3.5" />
            {tr ? `${test.source_label} temelli öz-değerlendirme` : `Based on ${test.source_label}`}
          </div>
        )}
        <h1 className="text-2xl font-bold text-brand-900 md:text-3xl">{test.title_tr}</h1>
        {test.intro_tr && (
          <p className="mt-4 text-sm leading-relaxed text-brand-700 md:text-base">{test.intro_tr}</p>
        )}
        <p className="mt-4 text-xs text-brand-500">
          {tr
            ? `${questions.length} soru · yaklaşık 2 dakika sürer. Bu bir tanı aracı değildir.`
            : `${questions.length} questions · about 2 minutes. This is not a diagnostic tool.`}
        </p>
        <Button className="mt-6 w-full md:w-auto" onClick={() => setStep('question')}>
          {tr ? 'Teste Başla' : 'Start the test'}
        </Button>
      </Card>
    );
  }

  // ── Soru ekranı ────────────────────────────────────────────────────
  if (step === 'question' && currentQuestion) {
    return (
      <Card className="border-transparent bg-accent-800 p-6 shadow-lg md:p-8">
        <div className="mb-6 h-1.5 w-full rounded-full bg-white/20">
          <div
            className="h-1.5 rounded-full bg-white transition-all"
            style={{ width: `${Math.round(((index + 1) / questions.length) * 100)}%` }}
          />
        </div>
        <div className="mb-2 text-xs font-medium text-white/75">
          {tr ? `Soru ${index + 1} / ${questions.length}` : `Question ${index + 1} / ${questions.length}`}
        </div>
        <h2 className="mb-6 text-lg font-semibold text-white md:text-xl">{currentQuestion.text_tr}</h2>
        <div className="flex flex-col gap-2">
          {test.scoring.scale.map((option) => {
            const selected = answers[currentQuestion.id] === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => selectAnswer(option.value)}
                className={
                  selected
                    ? 'flex items-center justify-between rounded-lg border border-[#d9c294] bg-[#f0e4c8] px-4 py-3 text-left text-sm font-medium text-brand-900 transition-colors'
                    : 'flex items-center justify-between rounded-lg border border-[#e2ece3] bg-white px-4 py-3 text-left text-sm font-medium text-brand-800 transition-colors hover:border-[#d9c294] hover:bg-[#f7f0dc]'
                }
              >
                {option.label_tr}
                {selected && <CheckIcon className="h-4 w-4 text-[#8a6c33]" />}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={goBack}
          className="mt-6 text-sm font-medium text-white/75 hover:text-white"
        >
          {tr ? '← Geri' : '← Back'}
        </button>
      </Card>
    );
  }

  // ── Sonuç ekranı ───────────────────────────────────────────────────
  if (step === 'result' && tier) {
    return (
      <Card className="p-6 md:p-8">
        <div className="mb-1 text-xs font-medium text-brand-500">
          {tr ? 'Sonucunuz' : 'Your result'}
        </div>
        <div className="mb-1 text-3xl font-bold text-brand-900">
          {score} / {test.scoring.max_score}
        </div>
        <div className="mb-4 inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-800">
          {tier.label_tr}
        </div>
        <p className="mb-6 text-sm leading-relaxed text-brand-700">{tier.summary_tr}</p>

        <div className="mb-6 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-xs leading-relaxed text-brand-800">
          {tr
            ? 'Bu sonuç bir tanı değildir, yalnızca genel bilgilendirme amaçlı bir öz-değerlendirmedir. Kesin bir değerlendirme için bir uzmana danışmanızı öneririz.'
            : 'This result is not a diagnosis — it is a general self-assessment for informational purposes only. We recommend consulting a specialist for a proper evaluation.'}
        </div>

        <Link
          href={therapistsHref}
          className="mb-6 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          {therapistsLabel}
          <ArrowUpRightIcon className="h-3.5 w-3.5" />
        </Link>

        <div className="border-t border-brand-100 pt-5">
          {submitted ? (
            <p className="text-sm font-medium text-brand-700">
              {tr ? 'Sonucunuz e-postanıza gönderildi.' : 'Your result has been emailed to you.'}
            </p>
          ) : (
            <form onSubmit={submitEmail} className="flex flex-col gap-3">
              <label className="text-sm font-medium text-brand-800">
                {tr ? 'Sonucumu e-postama gönder (opsiyonel)' : 'Email me this result (optional)'}
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="email"
                  required
                  placeholder={tr ? 'e-posta adresiniz' : 'your email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="sm:flex-1"
                />
                <Button type="submit" disabled={submitting || !consent} variant="outline">
                  {submitting ? (tr ? 'Gönderiliyor…' : 'Sending…') : tr ? 'Gönder' : 'Send'}
                </Button>
              </div>
              <label className="flex items-start gap-2 text-xs leading-relaxed text-brand-500">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5"
                />
                {tr
                  ? 'Sonucumun e-postama gönderilmesini ve Terapimap tarafından tarafımla iletişime geçilmesini kabul ediyorum.'
                  : 'I agree to receive this result by email and to be contacted by Terapimap.'}
              </label>
              {submitError && <p className="text-xs text-red-600">{submitError}</p>}
            </form>
          )}
        </div>
      </Card>
    );
  }

  return null;
}
