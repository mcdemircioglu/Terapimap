import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';

/**
 * POST /api/panel/appointments/[id]/cancel
 * Terapistin kendi randevusunu iptal etmesi. professionals.update
 * deseninin aksine burada RLS'e güveniyoruz (oturumlu istemci,
 * service-role DEĞİL): panel_leads_rls.sql'deki "yalnızca status/
 * cancelled_at kolonunu, yalnızca kendi satırında" deseniyle aynı —
 * appointments_migration.sql'de tanımlı.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('status', 'confirmed');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
