import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

import { verifyAdminRequest } from '@/lib/admin/auth';
function verifyAuth(request: Request): boolean {
  return verifyAdminRequest(request);
}

/* ── GET /api/admin/announcements ─────────────────────────────────────── */
export async function GET(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('announcements')
    .select(`*, professionals ( name, slug )`)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const announcements = (data ?? []).map((row: any) => {
    const { professionals, ...rest } = row;
    return {
      ...rest,
      professional_name: professionals?.name ?? null,
      professional_slug: professionals?.slug ?? null,
    };
  });

  return NextResponse.json(announcements);
}
