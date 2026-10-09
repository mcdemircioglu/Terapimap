import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { revalidatePublicTherapistPages } from '@/lib/revalidatePublicPages';

function verifyAuth(request: Request): boolean {
  const pw = request.headers.get('x-admin-password');
  return !!pw && pw === process.env.ADMIN_PASSWORD;
}

/**
 * Tüm herkese açık sayfaların önbelleğini temizler. Supabase'de (SQL Editor /
 * Table Editor) doğrudan veri değiştirdiğinde kullan: bu değişiklikler admin
 * paneli üzerinden geçmediği için otomatik tazelenmez, ISR süresi (profil 7 gün,
 * liste 24 saat) dolana kadar eski veri görünür.
 *
 * Sonraki ziyaretlerde sayfalar yeniden üretilir (ISR yazımı yapılır), bu yüzden
 * gereksiz yere sık çağırma.
 */
export async function POST(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  revalidatePublicTherapistPages();
  revalidateTag('specialties');
  // Profil detayları dahil /tr altındaki tüm sayfalar
  revalidatePath('/tr', 'layout');

  return NextResponse.json({ revalidated: true });
}
