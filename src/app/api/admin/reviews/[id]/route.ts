import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { revalidatePublicTherapistPages } from '@/lib/revalidatePublicPages';

function verifyAuth(request: Request): boolean {
  const pw = request.headers.get('x-admin-password');
  return !!pw && pw === process.env.ADMIN_PASSWORD;
}

/* ── PATCH /api/admin/reviews/[id] ────────────────────────────────────────
 * action: 'approve' | 'reject' | 'note'
 * Onaylanan bir yorum profile sayfasında hemen görünür hale gelir (ISR
 * revalidate tetiklenir) — reddedilen hiçbir zaman public'e çıkmaz.
 * ────────────────────────────────────────────────────────────────────── */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: Record<string, unknown> = await request.json();
  const { action, admin_note } = body as { action: string; admin_note?: string };

  const supabase = getServiceClient();

  const { data: review, error: reviewErr } = await supabase
    .from('reviews')
    .select('id, professional_id')
    .eq('id', params.id)
    .single();

  if (reviewErr || !review) {
    return NextResponse.json({ error: 'Değerlendirme bulunamadı.' }, { status: 404 });
  }

  if (action === 'approve' || action === 'reject') {
    const status = action === 'approve' ? 'approved' : 'rejected';
    const { error } = await supabase
      .from('reviews')
      .update({ status, admin_note: admin_note ?? null })
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (action === 'approve') {
      const { data: prof } = await supabase
        .from('professionals')
        .select('slug, professional_type')
        .eq('id', review.professional_id)
        .maybeSingle();
      revalidatePublicTherapistPages(prof ?? undefined);
    }

    return NextResponse.json({ ok: true, action: status });
  }

  if (action === 'note') {
    const { error } = await supabase
      .from('reviews')
      .update({ admin_note: admin_note ?? null })
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, action: 'note' });
  }

  return NextResponse.json({ error: 'Geçersiz aksiyon.' }, { status: 400 });
}

/* ── DELETE /api/admin/reviews/[id] ──────────────────────────────────────
 * Spam/uygunsuz yorumları kalıcı olarak silmek için (leads'teki delete ile
 * aynı desen).
 * ────────────────────────────────────────────────────────────────────── */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase.from('reviews').delete().eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
