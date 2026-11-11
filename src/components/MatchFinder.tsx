'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MATCH_HANDOFF_KEY } from '@/lib/matching/handoff';
import Avatar from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Honeypot, readHoneypot } from '@/components/Honeypot';

type Match = {
  id: string;
  name: string;
  title: string | null;
  city: string | null;
  imageUrl: string | null;
  isVerified: boolean;
  isOnline: boolean;
  url: string;
  reason: string;
};

type Result =
  | { kind: 'ok'; matches: Match[] }
  | { kind: 'no_match' }
  | { kind: 'crisis' }
  | { kind: 'error'; message: string };

// Sunucudaki sınırlarla aynı olmalı (src/lib/matching/extract.ts, api/eslestirme).
const MIN_LENGTH = 15;
const MAX_LENGTH = 1000;

const ERROR_MESSAGES: Record<string, string> = {
  too_short: 'Lütfen biraz daha ayrıntı yazın (en az 15 karakter).',
  too_long: 'Metin çok uzun. Lütfen kısaltın.',
  unavailable: 'Eşleştirme şu an kullanılamıyor. Lütfen biraz sonra tekrar deneyin.',
};

export default function MatchFinder({ directoryPath }: { directoryPath: string }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  // Ana sayfadaki kutudan gelen metin varsa al, hemen sil ve otomatik eşleştir.
  // Anahtar senkron silindiği için React Strict Mode'daki çift effect çağrısı
  // ikinci (ücretli) bir istek başlatmaz.
  useEffect(() => {
    let handed: string | null = null;
    try {
      handed = sessionStorage.getItem(MATCH_HANDOFF_KEY);
      if (handed !== null) sessionStorage.removeItem(MATCH_HANDOFF_KEY);
    } catch {
      return;
    }
    if (handed && handed.trim().length >= MIN_LENGTH) {
      setText(handed);
      void runMatch(handed, '');
    }
  }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Honeypot, ilk await'ten önce okunmalı (bkz. Honeypot.tsx).
    const hp = readHoneypot(e.currentTarget);
    if (text.trim().length < MIN_LENGTH) {
      setResult({ kind: 'error', message: ERROR_MESSAGES.too_short });
      return;
    }
    void runMatch(text, hp);
  }

  async function runMatch(value: string, hp: string) {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/eslestirme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value.trim(), hp_company: hp }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        setResult({
          kind: 'error',
          message: 'Bugün için eşleştirme hakkınız doldu. Dizinden kendiniz de arama yapabilirsiniz.',
        });
      } else if (!res.ok) {
        setResult({
          kind: 'error',
          message: ERROR_MESSAGES[data?.error] ?? 'Bir sorun oluştu. Lütfen tekrar deneyin.',
        });
      } else if (data.status === 'crisis') {
        setResult({ kind: 'crisis' });
      } else if (data.status === 'ok' && Array.isArray(data.matches) && data.matches.length > 0) {
        setResult({ kind: 'ok', matches: data.matches });
      } else {
        setResult({ kind: 'no_match' });
      }
    } catch {
      setResult({ kind: 'error', message: 'Bağlantı hatası. Lütfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Card className="relative p-6 md:p-8">
        <form onSubmit={onSubmit} noValidate>
          <Honeypot />
          <label htmlFor="match-text" className="block text-sm font-medium text-brand-900">
            Seni buraya getiren şey ne? Kendi cümlelerinle yaz.
          </label>
          <textarea
            id="match-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MAX_LENGTH}
            rows={6}
            placeholder="Örn: Son aylarda sık sık panik atak yaşıyorum, işte de çok bunalmış durumdayım. İstanbul'da yaşıyorum, online görüşmeyi de düşünebilirim."
            className="mt-2 w-full rounded-lg border border-brand-200 bg-white p-3 text-sm text-brand-900 placeholder:text-brand-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <div className="mt-1 flex items-center justify-between text-xs text-brand-600">
            <span>Şehir ve online/yüz yüze tercihini yazarsan sonuçlar daha isabetli olur.</span>
            <span aria-live="polite">
              {text.length}/{MAX_LENGTH}
            </span>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-brand-600">
            Yazdıkların yalnızca sana uygun uzmanları bulmak için analiz edilir ve saklanmaz. Bu
            bir teşhis ya da tedavi değildir.{' '}
            <Link href="/tr/kvkk-aydinlatma-metni" className="underline hover:text-brand-800">
              KVKK Aydınlatma Metni
            </Link>
          </p>

          <Button type="submit" size="lg" className="mt-5 w-full sm:w-auto" disabled={loading}>
            {loading ? 'Eşleştiriliyor…' : 'Bana uygun uzmanları bul'}
          </Button>
        </form>
      </Card>

      <div className="mt-8" aria-live="polite">
        {result?.kind === 'error' && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {result.message}
          </p>
        )}

        {result?.kind === 'crisis' && (
          <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-6">
            <h2 className="text-lg font-semibold text-amber-900">Yalnız değilsin</h2>
            <p className="mt-2 text-sm leading-relaxed text-amber-900">
              Yazdıkların seni çok zorlayan bir dönemden geçtiğini düşündürüyor. Şu an kendine zarar
              verme riski hissediyorsan lütfen hemen yardım al:
            </p>
            <ul className="mt-3 space-y-1 text-sm text-amber-900">
              <li>
                <strong>112 Acil Çağrı Merkezi:</strong> acil bir tehlike varsa.
              </li>
              <li>
                <strong>ALO 183 Sosyal Destek Hattı:</strong> 7/24 ücretsiz destek.
              </li>
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-amber-900">
              Güvendiğin bir kişiye bugün durumunu söylemen de önemli. Sakin olduğunda uzmanları{' '}
              <Link href={directoryPath} className="underline">
                dizinden inceleyebilirsin
              </Link>
              .
            </p>
          </div>
        )}

        {result?.kind === 'no_match' && (
          <Card className="p-6 text-sm leading-relaxed text-brand-700">
            Yazdıklarına tam uyan bir uzman bulamadık. Daha fazla ayrıntı (yaşadığın sıkıntı, şehir,
            online/yüz yüze tercihi) eklemeyi deneyebilir ya da{' '}
            <Link href={directoryPath} className="font-medium underline hover:text-brand-900">
              tüm uzmanlara göz atabilirsin
            </Link>
            .
          </Card>
        )}

        {result?.kind === 'ok' && (
          <section aria-labelledby="match-results">
            <h2 id="match-results" className="text-xl font-semibold text-brand-900">
              Sana uygun olabilecek uzmanlar
            </h2>
            <ul className="mt-4 space-y-4">
              {result.matches.map((m) => (
                <li key={m.id}>
                  <Card className="p-5">
                    <div className="flex gap-4">
                      <Avatar name={m.name} photoUrl={m.imageUrl} size="md" verified={m.isVerified} />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-brand-900">{m.name}</h3>
                        <p className="text-sm text-brand-600">
                          {[m.title, m.city].filter(Boolean).join(' · ')}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {m.isVerified && <Badge variant="accent">Doğrulanmış</Badge>}
                          {m.isOnline && <Badge>Online</Badge>}
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-brand-700">{m.reason}</p>
                        <Link
                          href={m.url}
                          className="mt-3 inline-block text-sm font-medium text-brand-700 underline hover:text-brand-900"
                        >
                          Profili incele
                        </Link>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-brand-600">
              Bu öneriler otomatik analizle üretilir; karar vermeden önce profilleri incelemeni
              öneririz.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
