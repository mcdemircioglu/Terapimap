'use client';

import { useState } from 'react';

/**
 * Terapistin WhatsApp mesajındaki bağlantıdan açtığı onay sayfası.
 * "Danışanla iletişime geçtim" → lead'in therapist_contacted_at'i doldurulur.
 * Lead detayları gösterilmez (URL'i olan herkese sızmasın); yalnızca onay.
 */
export default function IletisimeGectimPage({
  params: { leadId },
}: {
  params: { leadId: string };
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const confirm = async () => {
    setState('loading');
    try {
      const res = await fetch(`/api/iletisime-gectim/${leadId}`, { method: 'POST' });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50/60 to-white px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {state === 'done' ? (
          <>
            <h1 className="text-xl font-bold text-gray-900">Bildiriminiz alındı</h1>
            <p className="mt-2 text-sm text-gray-500">
              Danışanla iletişime geçtiğinizi kaydettik. İlginiz için teşekkür ederiz.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900">Danışanla iletişime geçtiniz mi?</h1>
            <p className="mt-2 text-sm text-gray-500">
              Terapimap üzerinden size iletilen danışan talebiyle iletişime geçtiyseniz, aşağıdaki
              butonla bize bildirebilirsiniz.
            </p>
            <button
              onClick={confirm}
              disabled={state === 'loading'}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
            >
              {state === 'loading' ? 'Gönderiliyor…' : 'Evet, danışanla iletişime geçtim'}
            </button>
            {state === 'error' && (
              <p className="mt-3 text-sm text-red-600">
                Bir sorun oluştu. Lütfen tekrar deneyin.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
