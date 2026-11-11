import { NextResponse } from 'next/server';
import {
  isRateLimited,
  tooManyRequests,
  isHoneypotTripped,
  fakeOk,
} from '@/lib/spamGuard';
import { getProfessionalUrl } from '@/lib/utils';
import { detectCrisis } from '@/lib/matching/safety';
import { extractIntent, MatchingUnavailableError, MAX_USER_TEXT_LENGTH } from '@/lib/matching/extract';
import { findMatches } from '@/lib/matching/match';
import { buildReason } from '@/lib/matching/reason';

// Her istek ücretli bir model çağrısı demek: genel JSON_LIMIT'ten daha sıkı.
// Bellek içi sayaç instance başına çalışır (spamGuard notuna bakın); asıl
// sağlam katman Vercel Firewall rate-limit kuralı ve OpenAI harcama limitidir.
const MATCH_LIMIT = { limit: 5, windowMs: 24 * 60 * 60 * 1000 };
const MIN_TEXT_LENGTH = 15;
const LOCALE = 'tr';

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  if (isHoneypotTripped(body)) return fakeOk({ status: 'no_match', matches: [] });

  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (text.length < MIN_TEXT_LENGTH) {
    return NextResponse.json({ error: 'too_short' }, { status: 400 });
  }
  if (text.length > MAX_USER_TEXT_LENGTH) {
    return NextResponse.json({ error: 'too_long' }, { status: 400 });
  }

  // Kriz kontrolü rate limit'ten ve modelden ÖNCE: krizdeki biri limite
  // takılıp yardım bilgisini görmeden kalmamalı, ayrıca metin modele gitmez.
  if (detectCrisis(text)) {
    return NextResponse.json({ status: 'crisis' });
  }

  if (isRateLimited(request, 'match', MATCH_LIMIT.limit, MATCH_LIMIT.windowMs)) {
    return tooManyRequests();
  }

  try {
    const intent = await extractIntent(text);

    // Model hiçbir uzmanlık çıkaramadıysa (konu dışı/anlamsız metin) rastgele
    // terapist göstermek yerine açıkça eşleşme yok deriz.
    if (intent.specialtySlugs.length === 0) {
      return NextResponse.json({ status: 'no_match', matches: [] });
    }

    const ranked = await findMatches(intent);
    if (ranked.length === 0) {
      return NextResponse.json({ status: 'no_match', matches: [] });
    }

    // Danışan metni ve niyet bilinçli olarak yanıtta ve logda yer almaz.
    return NextResponse.json({
      status: 'ok',
      matches: ranked.map((r) => ({
        id: r.therapist.id,
        name: r.therapist.name,
        title: r.therapist.title,
        city: r.therapist.city,
        imageUrl: r.therapist.image_url,
        isVerified: r.therapist.is_verified === true,
        isOnline: r.therapist.is_online === true,
        url: getProfessionalUrl(r.therapist.slug, r.therapist.professional_type, LOCALE),
        reason: buildReason(r),
      })),
    });
  } catch (e) {
    if (e instanceof MatchingUnavailableError) {
      console.error('[terapimap:matching]', e.message);
      return NextResponse.json({ error: 'unavailable' }, { status: 503 });
    }
    console.error('[terapimap:matching] beklenmeyen hata', e instanceof Error ? e.message : 'bilinmiyor');
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
