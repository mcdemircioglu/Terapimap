/**
 * Admin parola doğrulaması — tüm /api/admin/* uçları ve giriş ucu burayı kullanır.
 *  - timingSafeEqual: karşılaştırma süresi parolaya göre değişmez.
 *  - Başarısız deneme sınırı: aynı IP'den 15 dk içinde 8 yanlış denemeden sonra
 *    (doğru parola dahil) 429 verilir. Bellek içi/instance başına → en iyi çaba.
 */
import { createHash, timingSafeEqual } from 'crypto';
import { getClientIp } from '@/lib/spamGuard';

const MAX_FAILS = 8;
const WINDOW_MS = 15 * 60 * 1000;
const fails = new Map<string, { count: number; resetAt: number }>();

function sha(s: string) {
  return createHash('sha256').update(s).digest();
}

export function passwordMatches(candidate: string | null | undefined): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !candidate) return false;
  return timingSafeEqual(sha(candidate), sha(expected));
}

export function isAdminLockedOut(request: Request): boolean {
  const e = fails.get(getClientIp(request));
  return !!e && e.resetAt > Date.now() && e.count >= MAX_FAILS;
}

function recordFailure(request: Request) {
  const ip = getClientIp(request);
  const now = Date.now();
  const e = fails.get(ip);
  if (!e || e.resetAt <= now) fails.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  else e.count += 1;
  if (fails.size > 5000) {
    fails.forEach((v, k) => {
      if (v.resetAt <= now) fails.delete(k);
    });
  }
}

/** x-admin-password başlığını doğrular; kilitliyse veya yanlışsa false. */
export function verifyAdminRequest(request: Request): boolean {
  if (isAdminLockedOut(request)) return false;
  const ok = passwordMatches(request.headers.get('x-admin-password'));
  if (!ok) recordFailure(request);
  return ok;
}

/** Giriş ucu için: gövdedeki parolayı doğrular. */
export function verifyAdminPassword(request: Request, password: unknown): boolean {
  if (isAdminLockedOut(request)) return false;
  const ok = typeof password === 'string' && passwordMatches(password);
  if (!ok) recordFailure(request);
  return ok;
}
