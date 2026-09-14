import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';

function verifyAuth(request: Request): boolean {
  const pw = request.headers.get('x-admin-password');
  return !!pw && pw === process.env.ADMIN_PASSWORD;
}

/**
 * Uzmanlık alanları (specialties) tablosu doğrudan Supabase'den değiştirildiğinde
 * (yeni tür eklendiğinde, isim/slug güncellendiğinde vb.) `getSpecialties()`
 * önbelleği (src/lib/queries.ts, `tags: ['specialties']`) normalde en fazla
 * 1 saat içinde kendiliğinden tazelenir. Bu süre boyunca şehir+uzmanlık
 * kombinasyon sayfaları (`/tr/terapistler/[city]/[specialty]`) henüz
 * önbellekte olmayan/değişen slug'lar için 404 dönebilir.
 *
 * Bu endpoint'i çağırarak (taxonomy değişikliğinden hemen sonra) önbelleği
 * anında tazeleyebilirsin — 1 saat beklemene gerek kalmaz.
 */
export async function POST(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  revalidateTag('specialties');

  return NextResponse.json({ revalidated: true, tag: 'specialties' });
}
