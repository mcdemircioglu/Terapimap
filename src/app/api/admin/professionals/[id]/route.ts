import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

function verifyAuth(request: Request): boolean {
  const pw = request.headers.get('x-admin-password');
  return !!pw && pw === process.env.ADMIN_PASSWORD;
}

/* ── PUT /api/admin/professionals/[id] ────────────────────────────────────── */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { specialtyIds = [], ...professional } = body;

  // Strip empty strings
  const cleaned = Object.fromEntries(
    Object.entries(professional).filter(([, v]) => v !== ''),
  );

  // Remove read-only fields that shouldn't be sent in an update
  delete cleaned.id;
  delete cleaned.created_at;
  delete cleaned.updated_at;

  const supabase = getServiceClient();

  // Update professional row
  const { error } = await supabase
    .from('professionals')
    .update(cleaned)
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Replace specialty relations: delete old → insert new
  const { error: delError } = await supabase
    .from('professional_specialties')
    .delete()
    .eq('professional_id', params.id);

  if (delError) {
    return NextResponse.json(
      { error: `Updated professional but failed to clear specialties: ${delError.message}` },
      { status: 500 },
    );
  }

  if (specialtyIds.length > 0) {
    const { error: insError } = await supabase
      .from('professional_specialties')
      .insert(
        specialtyIds.map((id: string) => ({
          professional_id: params.id,
          specialty_id: id,
        })),
      );

    if (insError) {
      return NextResponse.json(
        { error: `Updated professional but failed to save specialties: ${insError.message}` },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}

/* ── DELETE /api/admin/professionals/[id] ─────────────────────────────────── */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();

  // Delete specialty relations first (FK constraint)
  await supabase
    .from('professional_specialties')
    .delete()
    .eq('professional_id', params.id);

  // Delete professional
  const { error } = await supabase
    .from('professionals')
    .delete()
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
