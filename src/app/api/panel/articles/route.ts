import { NextResponse } from 'next/server';
import { getServerClient, getServiceClient } from '@/lib/supabase/server';
import { validateTherapistArticlePayload } from '@/lib/articles';

/**
 * /api/panel/articles — terapistin kendi blog yazıları.
 *
 * Mevcut admin/articles akışından FARKLI: terapist burada yalnızca
 * 'draft' veya 'pending' (incelemeye gönder) durumuna geçebilir —
 * 'published' yalnızca admin onayıyla (bkz. /api/admin/articles/[id])
 * set edilir. Yazma service-role ile yapılır; yetki route içinde
 * oturumdan çözülen professional_id ile sağlanır (panel/upload-document
 * ile aynı desen).
 */

async function getOwnProfessionalId(): Promise<string | null> {
  const authedSupabase = getServerClient();
  const {
    data: { user },
  } = await authedSupabase.auth.getUser();
  if (!user) return null;

  const { data: professional } = await authedSupabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  return professional?.id ?? null;
}

/* ── GET: kendi yazılarım (her durumda) ───────────────────────────────── */
export async function GET() {
  const professionalId = await getOwnProfessionalId();
  if (!professionalId) {
    return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 404 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, slug, category, status, cover_image_url, admin_note, published_at, created_at, updated_at')
    .eq('professional_id', professionalId)
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ articles: data ?? [] });
}

/* ── POST: yeni yazı oluştur ───────────────────────────────────────────── */
export async function POST(request: Request) {
  const professionalId = await getOwnProfessionalId();
  if (!professionalId) {
    return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 });

  const { error: validationError, data } = validateTherapistArticlePayload(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  // action: 'submit' → incelemeye gönder (pending), yoksa taslak olarak kalır.
  const status = body.action === 'submit' ? 'pending' : 'draft';
  const published_at = null; // İlk yayın admin onayında işaretlenir.

  const supabase = getServiceClient();
  const { data: created, error } = await supabase
    .from('articles')
    .insert({ ...data, status, published_at, professional_id: professionalId, is_featured: false })
    .select('id')
    .single();

  if (error) {
    const msg = /duplicate|unique/i.test(error.message)
      ? 'Bu slug zaten kullanılıyor. Lütfen başlığı biraz değiştirin.'
      : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ id: created.id, status }, { status: 201 });
}
