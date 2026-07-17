/**
 * /api/admin/articles/[id] — tek içerik: getir, güncelle, sil.
 * Silme yalnızca admin auth sonrası çalışır; arayüz açık onay ister.
 */
import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { validateArticlePayload } from '@/lib/articles';

function verifyAuth(request: Request): boolean {
  const pw = request.headers.get('x-admin-password');
  return !!pw && pw === process.env.ADMIN_PASSWORD;
}

type Params = { params: { id: string } };

/* ── GET: tek içerik (form doldurmak için, draft dahil) ───────────────── */
export async function GET(request: Request, { params }: Params) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'İçerik bulunamadı.' }, { status: 404 });
  return NextResponse.json({ article: data });
}

/* ── PUT: güncelle ────────────────────────────────────────────────────── */
export async function PUT(request: Request, { params }: Params) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 });

  const { error: validationError, data } = validateArticlePayload(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const supabase = getServiceClient();
  const { error } = await supabase.from('articles').update(data).eq('id', params.id);

  if (error) {
    const msg = /duplicate|unique/i.test(error.message)
      ? 'Bu slug zaten kullanılıyor. Lütfen farklı bir slug girin.'
      : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

/* ── DELETE: kalıcı sil (arayüz açık onay ister) ──────────────────────── */
export async function DELETE(request: Request, { params }: Params) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase.from('articles').delete().eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
