import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { sendLeadToTherapist, sendConfirmationToClient } from '@/lib/email';

export const runtime = 'nodejs';

function verifyAuth(request: Request): boolean {
  const pw = request.headers.get('x-admin-password');
  return !!pw && pw === process.env.ADMIN_PASSWORD;
}

/* ── POST /api/admin/leads/[id]/send ──────────────────────────────────
 * Admin onayıyla lead'i ilgili terapiste mail olarak iletir ve
 * danışana bilgilendirme maili gönderir. Başarılıysa lead
 * status=contacted + sent_at olarak işaretlenir.
 * ────────────────────────────────────────────────────────────────── */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();

  const { data: lead, error } = await supabase
    .from('leads')
    .select('*, professionals ( id, name, email, slug, is_verified )')
    .eq('id', params.id)
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: 'Lead bulunamadı.' }, { status: 404 });
  }
  if (lead.sent_at) {
    return NextResponse.json(
      { error: 'Bu lead zaten gönderilmiş.' },
      { status: 409 },
    );
  }

  const professional = (lead as any).professionals;
  if (!professional) {
    return NextResponse.json(
      { error: 'Lead ile ilişkili terapist bulunamadı.' },
      { status: 404 },
    );
  }
  if (!professional.email) {
    return NextResponse.json(
      { error: `${professional.name} için kayıtlı e-posta adresi yok. Önce profile e-posta ekleyin.` },
      { status: 400 },
    );
  }

  const input = {
    lead: {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      message: lead.message,
    },
    professional: {
      id: professional.id,
      name: professional.name,
      email: professional.email,
      slug: professional.slug,
      is_verified: !!professional.is_verified,
    },
  };

  // 1) Terapiste gönder — başarısızsa hiçbir şey işaretlenmez.
  try {
    await sendLeadToTherapist(input);
  } catch (e: any) {
    return NextResponse.json(
      { error: `Terapiste mail gönderilemedi: ${e?.message ?? 'bilinmeyen hata'}` },
      { status: 502 },
    );
  }

  // 2) Danışana onay maili — başarısız olsa bile terapist maili gitti,
  //    lead yine de işaretlenir; uyarı döneriz.
  let clientMailError: string | null = null;
  try {
    await sendConfirmationToClient(input);
  } catch (e: any) {
    clientMailError = e?.message ?? 'bilinmeyen hata';
  }

  const sent_at = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from('leads')
    .update({ status: 'contacted', sent_at })
    .eq('id', params.id)
    .select()
    .single();

  return NextResponse.json({
    ok: true,
    lead: updated ?? { ...lead, status: 'contacted', sent_at },
    warning: clientMailError
      ? `Terapiste iletildi ancak danışana onay maili gönderilemedi: ${clientMailError}`
      : updateError
        ? 'Mailler gönderildi ancak durum güncellenemedi; sayfayı yenileyin.'
        : null,
  });
}
