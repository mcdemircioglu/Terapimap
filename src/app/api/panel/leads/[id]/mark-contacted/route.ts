import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';

/**
 * POST /api/panel/leads/[id]/mark-contacted
 *
 * Terapist, kendisine gönderilmiş bir talep için "iletişime geçtim"
 * onayı verir. Oturuma bağlı client kullanıyoruz: hem sahiplik hem de
 * yazma yetkisi tamamen panel_leads_rls.sql'deki RLS/GRANT ile
 * doğrulanıyor (yalnızca kendi, yalnızca gönderilmiş bir talep,
 * yalnızca therapist_contacted_at kolonu).
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
  }

  const { data: lead, error: leadErr } = await supabase
    .from('leads')
    .select('id, therapist_contacted_at')
    .eq('id', params.id)
    .maybeSingle();

  if (leadErr || !lead) {
    return NextResponse.json({ error: 'Talep bulunamadı.' }, { status: 404 });
  }

  if (lead.therapist_contacted_at) {
    return NextResponse.json({ ok: true, alreadyMarked: true });
  }

  const { error: updateErr } = await supabase
    .from('leads')
    .update({ therapist_contacted_at: new Date().toISOString() })
    .eq('id', params.id);

  if (updateErr) {
    return NextResponse.json(
      { error: 'İşaretlenemedi: ' + updateErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, alreadyMarked: false });
}
