import { NextResponse } from 'next/server';
import { getServerClient, getServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/panel/upload-photo
 *
 * Terapist panelden yeni bir profil fotoğrafı yükler. Bu yalnızca dosyayı
 * storage'a koyar ve genel-erişimli bir URL döner — professionals tablosuna
 * YAZMAZ. O URL, /api/panel/profile-update çağrısında image_url alanı
 * olarak diğer alanlarla birlikte moderasyon kuyruğuna girer.
 *
 * Depolama yazımı service-role ile yapılır (admin/upload route'uyla aynı
 * desen) — ama önce oturumun gerçekten bir profile bağlı olduğunu
 * doğruluyoruz, yani rastgele biri bu endpoint'i kullanamaz.
 */
const BUCKET = 'therapists';
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function POST(request: Request) {
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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Geçersiz form verisi.' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'Dosya bulunamadı.' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Yalnızca JPG, PNG veya WebP yükleyebilirsiniz.' },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Dosya boyutu 5 MB'ı geçemez." }, { status: 400 });
  }

  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = `profiles/${filename}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = getServiceClient();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('[panel/upload-photo] storage error:', uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}
