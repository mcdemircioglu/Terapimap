import { NextResponse } from 'next/server';
import { getServerClient, getServiceClient } from '@/lib/supabase/server';
import { revalidatePublicTherapistPages } from '@/lib/revalidatePublicPages';
import type { TherapistDocument } from '@/types/database';

/**
 * POST /api/panel/upload-document
 *
 * Terapist panelden diploma/sertifika/ek fotoğraf gibi bir belge yükler.
 *
 * BİLİNÇLİ MİMARİ FARK: /api/panel/profile-update'in aksine (ve mevcut
 * therapist_verification_requests moderasyon kuyruğunun aksine) bu route
 * professionals.documents dizisine DOĞRUDAN yazar — admin ön-onayı
 * beklemez, belge kaydedilir kaydedilmez profilde herkese açık görünür.
 * Bu, ürün kararı gereği (belge yükleme herkese açık ve anında yayınlanır;
 * admin yalnızca sonradan kaldırabilir).
 *
 * Yetkilendirme oturum üzerinden yapılır (yalnızca kendi profiline belge
 * ekleyebilir); asıl yazma service-role client ile yapılır çünkü
 * professionals tablosunda terapistin kendi satırını güncelleyebileceği
 * bir RLS politikası yok (upload-photo/profile-update route'larıyla aynı
 * desen: yetki route içinde kontrol edilir, yazım service-role'e devredilir).
 */
const BUCKET = 'therapist-documents';
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB — PDF'ler fotoğraftan büyük olabilir
const ALLOWED_TYPES: Record<string, 'pdf' | 'image'> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
};

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
    .select('id, documents, slug, professional_type')
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
  const storagePath = `${professional.id}/${filename}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const supabase = getServiceClient();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error('[panel/upload-document] storage error:', uploadError);
    return NextResponse.json({ error: 'Dosya yüklenemedi: ' + uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  const newDoc: TherapistDocument = {
    url: publicUrlData.publicUrl,
    name: file.name,
    type: kind,
    uploaded_at: new Date().toISOString(),
  };

  const currentDocs: TherapistDocument[] = Array.isArray(professional.documents)
    ? professional.documents
    : [];
  const updatedDocs = [...currentDocs, newDoc];

  const { error: updateError } = await supabase
    .from('professionals')
    .update({ documents: updatedDocs, updated_at: new Date().toISOString() })
    .eq('id', professional.id);

  if (updateError) {
    console.error('[panel/upload-document] db update error:', updateError);
    return NextResponse.json(
      { error: 'Belge yüklendi ama profile kaydedilemedi: ' + updateError.message },
      { status: 500 },
    );
  }

  // Belge herkese açık ve anında yayında — ISR önbelleğini beklemeden
  // terapistin detay sayfasını hemen tazele.
  revalidatePublicTherapistPages({
    slug: professional.slug,
    professional_type: professional.professional_type,
  });

  return NextResponse.json({ ok: true, document: newDoc, documents: updatedDocs }, { status: 201 });
}
