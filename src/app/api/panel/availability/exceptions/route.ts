import { NextResponse } from 'next/server';
import { getServerClient, getServiceClient } from '@/lib/supabase/server';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function getOwnProfessionalId(): Promise<string | null> {
  const supabase = getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  return data?.id ?? null;
}

/**
 * POST /api/panel/availability/exceptions
 * Oturumdaki terapist için tek günlük bir izin/tatil kaydı ekler
 * (is_closed = true — bu uçta o güne özel farklı saat tanımlama
 * desteklenmiyor, yalnızca "tamamen kapalı").
 */
export async function POST(request: Request) {
  const professionalId = await getOwnProfessionalId();
  if (!professionalId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const date = String(body?.date ?? '');
  const note = typeof body?.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 200) : null;

  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: 'invalid_date' }, { status: 400 });
  }

  const service = getServiceClient();
  const { data, error } = await service
    .from('availability_exceptions')
    .upsert(
      { professional_id: professionalId, date, is_closed: true, note },
      { onConflict: 'professional_id,date' },
    )
    .select('id, date, note')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, exception: data });
}

/**
 * DELETE /api/panel/availability/exceptions?id=...
 */
export async function DELETE(request: Request) {
  const professionalId = await getOwnProfessionalId();
  if (!professionalId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'missing_id' }, { status: 400 });
  }

  const service = getServiceClient();
  const { error } = await service
    .from('availability_exceptions')
    .delete()
    .eq('id', id)
    .eq('professional_id', professionalId); // başka terapistin kaydını silmeyi engelle

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
