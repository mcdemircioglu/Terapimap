import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

function verifyAuth(request: Request): boolean {
  const pw = request.headers.get('x-admin-password');
  return !!pw && pw === process.env.ADMIN_PASSWORD;
}

/**
 * POST /api/admin/professionals/[id]/panel-invite
 *
 * Doğrulama onayından TAMAMEN bağımsız, admin'in bilinçli tetiklediği bir
 * aksiyon: terapiste bir Supabase Auth hesabı açar (davet e-postasıyla) ve
 * professionals.user_id alanına bağlar. Panel erişimi ücretli bir ürün
 * olduğu için bu asla otomatik/toplu çalışmaz — yalnızca admin panelden
 * tek tek, admin ödeme/anlaşma sonrası karar verdiğinde çağrılır.
 *
 * Zaten bağlı bir hesap varsa (user_id dolu) hiçbir şey yapmaz (idempotent).
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();

  const { data: prof, error: profErr } = await supabase
    .from('professionals')
    .select('id, name, email, user_id')
    .eq('id', params.id)
    .maybeSingle();

  if (profErr || !prof) {
    return NextResponse.json({ error: 'Profesyonel bulunamadı.' }, { status: 404 });
  }

  if (prof.user_id) {
    return NextResponse.json({ ok: true, alreadyLinked: true });
  }

  if (!prof.email) {
    return NextResponse.json(
      { error: 'Bu profesyonelin e-posta adresi kayıtlı değil, panel daveti gönderilemez.' },
      { status: 400 },
    );
  }

  // Davetin geldiği isteğin origin'ini kullanıyoruz — böylece bu route
  // hem canlıda (terapimap.com) hem yerelde (npm run dev, localhost:3000)
  // deploy etmeden doğru redirect linkini üretir. Kullanılan origin,
  // Supabase Dashboard → Authentication → URL Configuration → Redirect
  // URLs allow-list'inde kayıtlı olmalı (localhost:3000 için de ekleyin).
  const siteUrl = new URL(request.url).origin;
  const { data: invited, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(
    prof.email,
    {
      data: { professional_id: prof.id },
      redirectTo: `${siteUrl}/panel/auth/callback`,
    },
  );

  if (inviteErr || !invited?.user?.id) {
    return NextResponse.json(
      { error: 'Davet gönderilemedi: ' + (inviteErr?.message ?? 'bilinmeyen hata') },
      { status: 500 },
    );
  }

  const { error: linkErr } = await supabase
    .from('professionals')
    .update({ user_id: invited.user.id })
    .eq('id', prof.id);

  if (linkErr) {
    return NextResponse.json(
      { error: 'Hesap oluşturuldu ama profile bağlanamadı: ' + linkErr.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, alreadyLinked: false });
}
