import { NextResponse } from 'next/server';
import { getServerClient, getServiceClient } from '@/lib/supabase/server';
import { revalidatePublicTherapistPages } from '@/lib/revalidatePublicPages';
import type { TherapistDocument } from '@/types/database';

/**
 * POST /api/panel/remove-document
 *
 * Terapist kendi yüklediği bir belgeyi kaldırır. upload-document ile aynı
 * mimari desen: doğrudan professionals.documents dizisinden çıkarır,
 * moderasyon kuyruğuna girmez.
 *
 * Not: storage'daki dosya silinmez (link sadece diziden kaldırılır) —
 * hem daha basit/güvenli (yanlışlıkla veri kaybı yok), hem de admin
 * tarafında ihtiyaç olursa geri eklenebilir.
 */
export async function POST(request: Request) {
  const authedSupabase = getServerClient();
  const {
    data: { user },
  } = await authedSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  const url = body.url as string | undefined;
  if (!url) {
    return NextResponse.json({ error: 'Kaldırılacak belge belirtilmedi.' }, { status: 400 });
  }

  const { data: professional } = await authedSupabase
    .from('professionals')
    .select('id, documents, slug, professional_type')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!professional) {
    return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 404 });
  }

  const currentDocs: TherapistDocument[] = Array.isArray(professional.documents)
    ? professional.documents
    : [];
  const updatedDocs = currentDocs.filter((d) => d.url !== url);

  if (updatedDocs.length === currentDocs.length) {
    return NextResponse.json({ error: 'Belge bulunamadı.' }, { status: 404 });
  }

  const supabase = getServiceClient();
  const { error: updateError } = await supabase
    .from('professionals')
    .update({ documents: updatedDocs, updated_at: new Date().toISOString() })
    .eq('id', professional.id);

  if (updateError) {
    return NextResponse.json(
      { error: 'Belge kaldırılamadı: ' + updateError.message },
      { status: 500 },
    );
  }

  revalidatePublicTherapistPages({
    slug: professional.slug,
    professional_type: professional.professional_type,
  });

  return NextResponse.json({ ok: true, documents: updatedDocs });
}
