import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

/**
 * POST /api/verification-requests/upload-document
 *
 * "Uzman Üye Ol" formundaki yeni başvuranlar için — /api/verification-requests/upload
 * (fotoğraf) ile aynı desen: henüz professional_id yok, geçici bir
 * `therapistId` (basvuru-...) klasörü altında saklanır. Yalnızca dosyayı
 * storage'a koyar ve URL döner; başvuru kaydına yazma işini form kendisi,
 * ana /api/verification-requests POST'unda `documents` alanıyla yapar.
 *
 * Not: bu belgeler admin onayına kadar hiçbir yerde herkese açık
 * gösterilmez (yeni başvuranın profili zaten onaylanana kadar yayında
 * değil) — moderasyon kuyruğuyla çelişmiyor, sadece henüz yayınlanacak
 * bir profil yok.
 */
const BUCKET = 'therapist-documents';
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES: Record<string, 'pdf' | 'image'> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
};

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Geçersiz form verisi.' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const therapistId = formData.get('therapistId') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'Dosya bulunamadı.' }, { status: 400 });
  }
  if (!therapistId) {
    return NextResponse.json({ error: 'Terapist ID bulunamadı.' }, { status: 400 });
  }

  const kind = ALLOWED_TYPES[file.type];
  if (!kind) {
    return NextResponse.json(
      { error: 'Yalnızca PDF, JPG, PNG veya WebP yükleyebilirsiniz.' },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Dosya boyutu 10 MB'ı geçemez." }, { status: 400 });
  }

  const extMap: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const ext = extMap[file.type];
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = `verification-requests/${therapistId}/${filename}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const supabase = getServiceClient();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error('[verification-requests/upload-document] storage error:', uploadError);
    return NextResponse.json({ error: 'Dosya yüklenemedi: ' + uploadError.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  return NextResponse.json(
    { url: data.publicUrl, name: file.name, type: kind },
    { status: 201 },
  );
}
