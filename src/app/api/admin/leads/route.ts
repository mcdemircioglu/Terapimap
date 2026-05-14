import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

function verifyAuth(request: Request): boolean {
  const pw = request.headers.get('x-admin-password');
  return !!pw && pw === process.env.ADMIN_PASSWORD;
}

/* ── GET /api/admin/leads ─────────────────────────────────────────── */
export async function GET(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('leads')
    .select(`*, professionals ( name )`)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const leads = (data ?? []).map((row: any) => {
    const { professionals, ...rest } = row;
    return { ...rest, professional_name: professionals?.name ?? null };
  });

  return NextResponse.json(leads);
}
