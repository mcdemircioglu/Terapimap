import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';

const BUCKET = 'therapist-photos';
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/* ── POST /api/verification-requests/upload ───────────────────────────────── */
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

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Sadece JPG, PNG ve WebP formatları kabul edilmektedir.' },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'Dosya boyutu 5 MB\'ı geçemez.' },
      { status: 400 },
    );
  }

  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = `verification-requests/${therapistId}/${filename}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const supabase = getServiceClient();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error('[verification-requests/upload] storage error:', uploadError);
    return NextResponse.json({ error: 'Dosya yüklenemedi: ' + uploadError.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}
