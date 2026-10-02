import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { revalidatePublicTherapistPages } from '@/lib/revalidatePublicPages';

function verifyAuth(request: Request): boolean {
  const pw = request.headers.get('x-admin-password');
  return !!pw && pw === process.env.ADMIN_PASSWORD;
}

/* ── PUT /api/admin/professionals/[id] ────────────────────────────────────── */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { specialtyIds = [], ...professional } = body;

  // Strip empty strings
  const cleaned = Object.fromEntries(
    Object.entries(professional).filter(([, v]) => v !== ''),
  );

  // Remove read-only fields that shouldn't be sent in an update
  delete cleaned.id;
  delete cleaned.created_at;
  delete cleaned.updated_at;

  const supabase = getServiceClient();

  // Update professional row
  const { error } = await supabase
    .from('professionals')
    .update(cleaned)
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Replace specialty relations: delete old → insert new
  const { error: delError } = await supabase
    .from('professional_specialties')
    .delete()
    .eq('professional_id', params.id);

  if (delError) {
    return NextResponse.json(
      { error: `Updated professional but failed to clear specialties: ${delError.message}` },
      { status: 500 },
    );
  }

  if (specialtyIds.length > 0) {
    const { error: insError } = await supabase
      .from('professional_specialties')
      .insert(
        specialtyIds.map((id: string) => ({
          professional_id: params.id,
          specialty_id: id,
        })),
      );

    if (insError) {
      return NextResponse.json(
        { error: `Updated professional but failed to save specialties: ${insError.message}` },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}

/* ── DELETE /api/admin/professionals/[id] ─────────────────────────────────── */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();

  // Silmeden önce slug/professional_type'ı alıyoruz — kayıt gittikten sonra
  // hangi detay sayfasını tazeleyeceğimizi bilemeyiz.
  const { data: professional } = await supabase
    .from('professionals')
    .select('slug, professional_type')
    .eq('id', params.id)
    .maybeSingle();

  // Delete specialty relations first (FK constraint)
  await supabase
    .from('professional_specialties')
    .delete()
    .eq('professional_id', params.id);

  // Delete professional
  const { error } = await supabase
    .from('professionals')
    .delete()
    .eq('id', params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePublicTherapistPages(professional);

  return NextResponse.json({ ok: true });
}

/**
 * PATCH /api/admin/professionals/[id]
 *
 * Şu an tek amacı: Belge Yükleme herkese açık ve anında yayınlandığı için
 * (bkz. /api/panel/upload-document), admin'in sonradan uygunsuz/yanlış bir
 * belgeyi kaldırabilmesi gerekiyor. Bu handler yalnızca
 * `{ removeDocumentUrl: string }` body'siyle çağrılır; başka bir alanı
 * güncellemez (profesyonel düzenleme yukarıdaki PUT üzerinden devam eder).
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
