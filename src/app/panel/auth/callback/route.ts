import { NextResponse, type NextRequest } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';

/**
 * Supabase Auth davet/kurtarma bağlantılarının döndüğü yer.
 * `code` parametresini oturuma çevirir (PKCE akışı) ve kullanıcıyı
 * şifre belirleme ekranına yönlendirir.
 *
 * NOT: Bu route'un çalışması için Supabase Dashboard → Authentication →
 * URL Configuration → Redirect URLs listesine
 * `{SITE_URL}/panel/auth/callback` eklenmiş olması gerekir.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = getServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/panel/sifre-belirle`);
    }
  }

  return NextResponse.redirect(`${origin}/panel/giris?hata=davet_gecersiz`);
}
