import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getServiceClient } from '@/lib/supabase/server';

import { verifyAdminRequest } from '@/lib/admin/auth';
function verifyAuth(request: Request): boolean {
  return verifyAdminRequest(request);
}

/** Yayındaki /duyurular sayfasını (ve olası tip filtreli varyantlarını) anında tazeler. */
function revalidateAnnouncementPages() {
  revalidatePath('/tr/duyurular');
  revalidateTag('announcements-list');
}

/* ── PATCH /api/admin/announcements/[id] ──────────────────────────────
 * action: 'approve' | 'reject' | 'note'
 * Onaylanan bir duyuru /duyurular sayfasında hemen görünür hale gelir —
 * reddedilen hiçbir zaman public'e çıkmaz (reviews ile aynı desen).
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

  const { data: announcement, error: fetchErr } = await supabase
    .from('announcements')
    .select('id, professional_id')
    .eq('id', params.id)
    .single();

  if (fetchErr || !announcement) {
    return NextResponse.json({ error: 'Duyuru bulunamadı.' }, { status: 404 });
  }

  if (action === 'approve' || action === 'reject') {
    const status = action === 'approve' ? 'published' : 'rejected';
    const { error } = await supabase
      .from('announcements')
      .update({ status, admin_note: admin_note ?? null })
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (action === 'approve') {
      revalidateAnnouncementPages();
    }

    return NextResponse.json({ ok: true, action: status });
  }

  if (action === 'note') {
    const { error } = await supabase
      .from('announcements')
      .update({ admin_note: admin_note ?? null })
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, action: 'note' });
  }

  return NextResponse.json({ error: 'Geçersiz aksiyon.' }, { status: 400 });
}

/* ── DELETE /api/admin/announcements/[id] ─────────────────────────────
 * Uygunsuz/spam duyuruları kalıcı olarak silmek için.
 * ────────────────────────────────────────────────────────────────────── */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();

  const { data: announcement } = await supabase
    .from('announcements')
    .select('id, status')
    .eq('id', params.id)
    .maybeSingle();

  const { error } = await supabase.from('announcements').delete().eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (announcement?.status === 'published') {
    revalidateAnnouncementPages();
  }

  return new NextResponse(null, { status: 204 });
}
