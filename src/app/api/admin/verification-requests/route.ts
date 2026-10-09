import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

import { verifyAdminRequest } from '@/lib/admin/auth';
function verifyAuth(request: Request): boolean {
  return verifyAdminRequest(request);
}

/* ── GET /api/admin/verification-requests ─────────────────────────────────── */
export async function GET(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? 'pending';
  const type = searchParams.get('type'); // 'new' → yeni başvurular; boş → hepsi

  const supabase = getServiceClient();

  // Liste görünümleri için yalnızca gereken kolonlar (documents, message gibi
  // ağır alanlar yok). Tam kayıt GET /[id] ile çekilir.
  const columns =
    type === 'new'
      ? 'id, request_type, full_name, email, phone, title, professional_type, city, district, bio, price_range, website, instagram, google_maps_url, offers_online, offers_in_person, specialties, photo_url, status, admin_note, created_at'
      : 'id, professional_id, request_type, full_name, email, phone, status, admin_note, created_at';

  let query = supabase
    .from('therapist_verification_requests')
    .select(columns)
    .order('created_at', { ascending: false });

  if (status !== 'all') {
    query = query.eq('status', status);
  }
  if (type) {
    query = query.eq('request_type', type);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
