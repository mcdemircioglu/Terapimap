import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { revalidatePublicTherapistPages } from '@/lib/revalidatePublicPages';

function verifyAuth(request: Request): boolean {
  const pw = request.headers.get('x-admin-password');
  return !!pw && pw === process.env.ADMIN_PASSWORD;
}

/**
 * PATCH /api/admin/professionals/[id]
 *
 * Şu an tek amacı: Belge Yükleme herkese açık ve anında yayınlandığı için
 * (bkz. /api/panel/upload-document), admin'in sonradan uygunsuz/yanlış bir
 * belgeyi kaldırabilmesi gerekiyor. Bu route yalnızca
 * `{ removeDocumentUrl: string }` body'siyle çağrılır; başka bir alanı
 * güncellemez (profesyonel düzenleme mevcut verification-requests onay
 * akışından geçiyor, bunu genişletmiyoruz).
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: Record<string, unknown> = await request.json().catch(() => ({}));
  const removeDocumentUrl = body.removeDocumentUrl as string | undefined;

  if (!removeDocumentUrl) {
    return NextResponse.json({ error: 'removeDocumentUrl zorunludur.' }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: professional, error: fetchErr } = await supabase
    .from('professionals')
    .select('id, documents, slug, professional_type')
    .eq('id', params.id)
    .maybeSingle();

  if (fetchErr || !professional) {
    return NextResponse.json({ error: 'Profesyonel bulunamadı.' }, { status: 404 });
  }

  const currentDocs: { url: string }[] = Array.isArray(professional.documents)
    ? professional.documents
    : [];
  const updatedDocs = currentDocs.filter((d) => d.url !== removeDocumentUrl);

  if (updatedDocs.length === currentDocs.length) {
    return NextResponse.json({ error: 'Belge bulunamadı.' }, { status: 404 });
  }

  const { error: updateErr } = await supabase
    .from('professionals')
    .update({ documents: updatedDocs, updated_at: new Date().toISOString() })
    .eq('id', params.id);

  if (updateErr) {
    return NextResponse.json({ error: 'Belge kaldırılamadı: ' + updateErr.message }, { status: 500 });
  }

  revalidatePublicTherapistPages({
    slug: professional.slug,
    professional_type: professional.professional_type,
  });

  return NextResponse.json({ ok: true, documents: updatedDocs });
}
