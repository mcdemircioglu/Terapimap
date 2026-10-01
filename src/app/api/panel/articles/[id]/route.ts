import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerClient, getServiceClient } from '@/lib/supabase/server';
import { validateTherapistArticlePayload } from '@/lib/articles';

type Params = { params: { id: string } };

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

/** Yayındaki/kategorideki Psikoloji Rehberi sayfalarını anında tazeler. */
function revalidateArticlePages(slug: string, category: string) {
  revalidatePath('/tr/psikoloji-rehberi');
  revalidatePath(`/tr/psikoloji-rehberi/${slug}`);
  revalidatePath(`/tr/psikoloji-rehberi/kategori/${category}`);
}

/* ── GET: tek yazı (düzenleme formu için, yalnızca kendi yazısı) ─────────── */
export async function GET(request: Request, { params }: Params) {
  const professionalId = await getOwnProfessionalId();
  if (!professionalId) {
    return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 404 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', params.id)
    .eq('professional_id', professionalId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Yazı bulunamadı.' }, { status: 404 });
  return NextResponse.json({ article: data });
}

/* ── PUT: güncelle (yalnızca kendi yazısı) ────────────────────────────────
 * Durum geçişi:
 *  - Mevcut durum 'published' ise → düzenleme ANINDA yayına yansır,
 *    status 'published' kalır (ürün kararı: yeniden onay istenmiyor).
 *  - Mevcut durum 'draft'/'pending'/'rejected' ise → action='submit'
 *    gönderilirse 'pending'e geçer, yoksa 'draft'ta kalır.
 */
export async function PUT(request: Request, { params }: Params) {
  const professionalId = await getOwnProfessionalId();
  if (!professionalId) {
    return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 404 });
  }

  const supabase = getServiceClient();
  const { data: existing, error: fetchErr } = await supabase
    .from('articles')
    .select('id, status, professional_id, category')
    .eq('id', params.id)
    .maybeSingle();

  if (fetchErr || !existing || existing.professional_id !== professionalId) {
    return NextResponse.json({ error: 'Yazı bulunamadı.' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 });

  const { error: validationError, data } = validateTherapistArticlePayload(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const wasPublished = existing.status === 'published';
  const status = wasPublished ? 'published' : body.action === 'submit' ? 'pending' : 'draft';
  // Reddedilmiş bir yazı tekrar gönderilince eski red notu artık geçersiz.
  const admin_note = status === 'pending' ? null : undefined;

  const updatePayload: Record<string, unknown> = { ...data, status };
  if (admin_note !== undefined) updatePayload.admin_note = admin_note;
  // published_at'a dokunmuyoruz: yayındaki bir yazı düzenlendiğinde orijinal
  // yayın tarihi korunur (yalnızca updated_at değişir) — admin onayı
  // sırasında (ilk yayına giriş) zaten ayrıca set ediliyor.

  const { error: updateErr } = await supabase
    .from('articles')
    .update(updatePayload)
    .eq('id', params.id);

  if (updateErr) {
    const msg = /duplicate|unique/i.test(updateErr.message)
      ? 'Bu slug zaten kullanılıyor. Lütfen başlığı biraz değiştirin.'
      : updateErr.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (wasPublished) {
    revalidateArticlePages(data!.slug as string, data!.category as string);
    // Kategori değiştiyse eski kategori sayfası da tazelensin.
    if (existing.category && existing.category !== data!.category) {
      revalidatePath(`/tr/psikoloji-rehberi/kategori/${existing.category}`);
    }
  }

  return NextResponse.json({ ok: true, status });
}

/* ── DELETE: yalnızca yayınlanmamış kendi yazısı silinebilir ─────────────── */
export async function DELETE(request: Request, { params }: Params) {
  const professionalId = await getOwnProfessionalId();
  if (!professionalId) {
    return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 404 });
  }

  const supabase = getServiceClient();
  const { data: existing, error: fetchErr } = await supabase
    .from('articles')
    .select('id, status, professional_id')
    .eq('id', params.id)
    .maybeSingle();

  if (fetchErr || !existing || existing.professional_id !== professionalId) {
    return NextResponse.json({ error: 'Yazı bulunamadı.' }, { status: 404 });
  }

  if (existing.status === 'published') {
    return NextResponse.json(
      { error: 'Yayındaki bir yazıyı kaldırmak için Terapimap ekibiyle iletişime geçin.' },
      { status: 400 },
    );
  }

  const { error: deleteErr } = await supabase.from('articles').delete().eq('id', params.id);
  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
