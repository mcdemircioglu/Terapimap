import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

function verifyAuth(request: Request): boolean {
  const pw = request.headers.get('x-admin-password');
  return !!pw && pw === process.env.ADMIN_PASSWORD;
}

/* ── GET /api/admin/professionals ─────────────────────────────────────────── */
export async function GET(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('professionals')
    .select(
      `*,
       professional_specialties (
         specialties ( id, slug, name )
       )`,
    )
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten specialty join into a simple array on each professional
  const professionals = (data ?? []).map((row: any) => {
    const { professional_specialties, ...rest } = row;
    return {
      ...rest,
      specialties: (professional_specialties ?? [])
        .map((ps: any) => ps.specialties)
        .filter(Boolean),
    };
  });

  return NextResponse.json(professionals);
}

/* ── POST /api/admin/professionals ────────────────────────────────────────── */
export async function POST(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { specialtyIds = [], ...professional } = body;

  // Remove any undefined / null empty-string values that shouldn't be sent
  const cleaned = Object.fromEntries(
    Object.entries(professional).filter(([, v]) => v !== ''),
  );

  const supabase = getServiceClient();

  // Insert professional
  const { data, error } = await supabase
    .from('professionals')
    .insert(cleaned)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Insert specialty relations
  if (specialtyIds.length > 0) {
    const { error: specError } = await supabase
      .from('professional_specialties')
      .insert(
        specialtyIds.map((id: string) => ({
          professional_id: data.id,
          specialty_id: id,
        })),
      );

    if (specError) {
      // Professional was created — return partial success with warning
      return NextResponse.json(
        { ...data, warning: `Professional created but specialties failed: ${specError.message}` },
        { status: 201 },
      );
    }
  }

  return NextResponse.json(data, { status: 201 });
}
