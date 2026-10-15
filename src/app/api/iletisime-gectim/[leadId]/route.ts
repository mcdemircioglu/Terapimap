import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

/**
 * Terapistin "danışanla iletişime geçtim" bildirimi.
 * Lead id (UUID) ile korunur — tahmin edilemez olduğu için public.
 * therapist_contacted_at'i doldurur; zaten doluysa dokunmaz.
 */
export async function POST(
  _request: Request,
  { params }: { params: { leadId: string } },
) {
  const supabase = getServiceClient();

  const { data: lead, error } = await supabase
    .from('leads')
    .select('id, therapist_contacted_at')
    .eq('id', params.leadId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!lead) {
    return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 });
  }

  if (!lead.therapist_contacted_at) {
    const { error: updErr } = await supabase
      .from('leads')
      .update({ therapist_contacted_at: new Date().toISOString() })
      .eq('id', params.leadId);
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
