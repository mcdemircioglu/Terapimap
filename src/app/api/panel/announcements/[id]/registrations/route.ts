import { NextResponse } from 'next/server';
import { getServerClient, getServiceClient } from '@/lib/supabase/server';

type Params = { params: { id: string } };

/* ── GET: bir duyuruya gelen kayıtlar (yalnızca kendi duyurusu) ───────── */
export async function GET(request: Request, { params }: Params) {
  const authedSupabase = getServerClient();
  const {
    data: { user },
  } = await authedSupabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
  }

  const { data: professional } = await authedSupabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!professional) {
    return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 404 });
  }

  const supabase = getServiceClient();

  // Duyurunun gerçekten bu terapiste ait olduğunu doğrula.
  const { data: announcement } = await supabase
    .from('announcements')
    .select('id, professional_id')
    .eq('id', params.id)
    .maybeSingle();
  if (!announcement || announcement.professional_id !== professional.id) {
    return NextResponse.json({ error: 'Duyuru bulunamadı.' }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('announcement_registrations')
    .select('id, name, email, phone, message, created_at')
    .eq('announcement_id', params.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ registrations: data ?? [] });
}
