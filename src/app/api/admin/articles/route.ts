/**
 * /api/admin/articles — admin içerik yönetimi (liste + oluşturma).
 * Mevcut admin authorization deseni: x-admin-password header + service role client.
 */
import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { validateArticlePayload } from '@/lib/articles';

function verifyAuth(request: Request): boolean {
  const pw = request.headers.get('x-admin-password');
  return !!pw && pw === process.env.ADMIN_PASSWORD;
}


/* ── GET: tüm içerikler (draft dahil) ─────────────────────────────────── */
export async function GET(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, slug, category, status, is_featured, published_at, created_at, updated_at')
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ articles: data ?? [] });
}

/* ── POST: yeni içerik ────────────────────────────────────────────────── */
export async function POST(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 });

  const { error: validationError, data } = validateArticlePayload(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const supabase = getServiceClient();
  const { data: created, error } = await supabase
    .from('articles')
    .insert(data)
    .select('id')
    .single();

  if (error) {
    // unique violation → anlaşılır mesaj
    const msg = /duplicate|unique/i.test(error.message)
      ? 'Bu slug zaten kullanılıyor. Lütfen farklı bir slug girin.'
      : error.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ id: created.id }, { status: 201 });
}
