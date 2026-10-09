/**
 * Herkese açık POST uç noktaları için hafif spam koruması.
 *
 * 1) Honeypot: formlardaki gizli `hp_company` alanı. İnsanlar görmez/doldurmaz;
 *    form dolduran botlar doldurur. Dolu gelirse sessizce "başarılı" döneriz
 *    (bot fark etmesin), ama kayıt/e-posta yapmayız.
 * 2) Rate limit: IP başına, bellek içi sayaç. Serverless'ta her instance
 *    kendi sayacını tutar — "en iyi çaba" koruması; asıl sağlam katman
 *    Vercel Firewall rate-limit kuralıdır.
 */
import { NextResponse } from 'next/server';

export const HONEYPOT_FIELD = 'hp_company';

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  buckets.forEach((b, k) => {
    if (b.resetAt <= now) buckets.delete(k);
  });
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export function isHoneypotTripped(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  const v = (body as Record<string, unknown>)[HONEYPOT_FIELD];
  return typeof v === 'string' ? v.trim().length > 0 : v != null && v !== false;
}

/** true → limit aşıldı. */
export function isRateLimited(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  sweep(now);
  const key = `${scope}:${getClientIp(request)}`;
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  b.count += 1;
  return b.count > limit;
}

export function tooManyRequests() {
  return NextResponse.json(
    { error: 'Çok fazla istek gönderildi. Lütfen birkaç dakika sonra tekrar deneyin.' },
    { status: 429, headers: { 'Retry-After': '600' } },
  );
}

/** Honeypot'a takılan botlara sahte başarı yanıtı. */
export function fakeOk(extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: true, success: true, ...extra });
}

export const JSON_LIMIT = { limit: 10, windowMs: 10 * 60 * 1000 };
export const UPLOAD_LIMIT = { limit: 30, windowMs: 10 * 60 * 1000 };
