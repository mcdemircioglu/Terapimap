import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { sendPanelInviteEmail } from '@/lib/email';

function verifyAuth(request: Request): boolean {
  const pw = request.headers.get('x-admin-password');
  return !!pw && pw === process.env.ADMIN_PASSWORD;
}

/**
 * POST /api/admin/professionals/[id]/panel-invite
 *
 * Doğrulama onayından TAMAMEN bağımsız, admin'in bilinçli tetiklediği bir
 * aksiyon: terapiste bir Supabase Auth hesabı açar ve kendi Gmail SMTP
 * sistemimizle (sendPanelInviteEmail) markalı bir davet e-postası gönderir ve
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
  //
  // Supabase'in kendi (markasız, mail.app.supabase.io'dan giden) davet
  // e-postası yerine: hesabı generateLink ile e-posta GÖNDERMEDEN
  // oluşturuyoruz, dönen action_link'i kendi Gmail SMTP sistemimizle
  // (iletisim@terapimap.com, bkz. sendPanelInviteEmail) gönderiyoruz.
  const siteUrl = new URL(request.url).origin;
  const { data: generated, error: inviteErr } = await supabase.auth.admin.generateLink({
    type: 'invite',
    email: prof.email,
    options: {
      data: { professional_id: prof.id },
      redirectTo: `${siteUrl}/panel/auth/callback`,
    },
  });

  if (inviteErr || !generated?.user?.id || !generated.properties?.action_link) {
    return NextResponse.json(
      { error: 'Davet gönderilemedi: ' + (inviteErr?.message ?? 'bilinmeyen hata') },
      { status: 500 },
    );
  }

  const { error: linkErr } = await supabase
    .from('professionals')
    .update({ user_id: generated.user.id })
    .eq('id', prof.id);

  if (linkErr) {
    return NextResponse.json(
      { error: 'Hesap oluşturuldu ama profile bağlanamadı: ' + linkErr.message },
      { status: 500 },
    );
  }

  try {
    await sendPanelInviteEmail({
      name: prof.name,
      email: prof.email,
      inviteUrl: generated.properties.action_link,
    });
  } catch (mailErr) {
    // Hesap zaten oluşturuldu ve profile bağlandı — yalnızca e-posta
    // gönderimi başarısız oldu. Admin'i bunun farkında olması için hata
    // döndürüyoruz (bilinen sınırlama: user_id artık dolu olduğu için bu
    // route idempotent davranır ve tekrar çağrılırsa "alreadyLinked: true"
    // döner — tekrar e-posta denemek için önce o alan elle temizlenmeli).
    console.error('[panel-invite] davet e-postası gönderilemedi:', mailErr);
    return NextResponse.json(
      { error: 'Hesap oluşturuldu ama davet e-postası gönderilemedi: ' + (mailErr as Error).message },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, alreadyLinked: false });
}
