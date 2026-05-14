import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

function verifyAuth(request: Request): boolean {
  const pw = request.headers.get('x-admin-password');
  return !!pw && pw === process.env.ADMIN_PASSWORD;
}

/* ── PATCH /api/admin/leads/[id] ──────────────────────────────────── */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { status } = await request.json();
  const allowed = ['new', 'reviewed', 'contacted', 'spam'];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/* ── DELETE /api/admin/leads/[id] ─────────────────────────────────── */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
