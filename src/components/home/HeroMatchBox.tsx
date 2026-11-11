'use client';

/**
 * Ana sayfa hero'sundaki "arama kutusu" görünümlü AI eşleştirme girişi.
 * Metin burada gönderilmez; sessionStorage'a yazılıp /eslestirme sayfasına
 * geçilir, orada otomatik eşleştirme başlar (bkz. lib/matching/handoff.ts).
 */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MATCH_HANDOFF_KEY } from '@/lib/matching/handoff';

// Sunucudaki sınırlarla aynı olmalı (api/eslestirme).
const MIN_LENGTH = 15;
const MAX_LENGTH = 1000;

export default function HeroMatchBox({ matchPath }: { matchPath: string }) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [hint, setHint] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = text.trim();
    if (value.length < MIN_LENGTH) {
      setHint(true);
      return;
    }
    try {
      sessionStorage.setItem(MATCH_HANDOFF_KEY, value);
    } catch {
      // sessionStorage kapalıysa (gizli mod kısıtı vb.) metin taşınamaz;
      // kullanıcı eşleştirme sayfasında yeniden yazar.
    }
    router.push(matchPath);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="w-full max-w-2xl">
      {/* Kutunun ne yaptığını ilk bakışta söyleyen etiket; ekran okuyucu için de asıl label bu. */}
      <label
        htmlFor="hero-match-text"
        className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#7ee6cf]"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16z" />
        </svg>
        Yapay zekâ ile terapistini bul
      </label>
      <div className="rounded-3xl border border-white/20 bg-white p-3 shadow-lg focus-within:ring-2 focus-within:ring-white/40 sm:p-4">
        <textarea
          id="hero-match-text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (hint) setHint(false);
          }}
          maxLength={MAX_LENGTH}
          rows={2}
          placeholder="Seni buraya getiren şeyi yaz… Örn: Sık sık panik atak yaşıyorum, İstanbul'da online görüşmek istiyorum."
          className="block w-full resize-none bg-transparent px-2 py-1 text-base text-brand-950 placeholder:text-brand-400 focus:outline-none"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-full bg-brand-600 px-6 text-sm font-medium text-white transition-colors hover:bg-brand-700 active:bg-brand-800"
          >
            En uygun terapisti bul
          </button>
        </div>
      </div>
      {hint && (
        <p role="alert" className="mt-2 text-sm text-[#7ee6cf]">
          Lütfen biraz daha ayrıntı yaz (en az {MIN_LENGTH} karakter).
        </p>
      )}
    </form>
  );
}
