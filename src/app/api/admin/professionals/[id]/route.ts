import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { verifyAdminRequest } from '@/lib/admin/auth';
import {
  revalidatePublicTherapistPages,
  revalidateProfessionalPageOnly,
  LIST_AFFECTING_FIELDS,
} from '@/lib/revalidatePublicPages';

// Karşılaştırma için null/undefined/'' ve sayı/metin farklarını eşitler.
const norm = (v: unknown) => (v === null || v === undefined ? '' : String(v));
// Zaman damgaları farklı biçimde (+03:00 / UTC) gelebilir → anlık olarak karşılaştır.
const sameValue = (key: string, a: unknown, b: unknown) => {
  if (key === 'featured_until' && a && b) {
    const ta = new Date(String(a)).getTime();
    const tb = new Date(String(b)).getTime();
    if (!Number.isNaN(ta) && !Number.isNaN(tb)) return ta === tb;
  }
  return norm(a) === norm(b);
};

function verifyAuth(request: Request): boolean {
  return verifyAdminRequest(request);
}

// PostgREST, fonksiyon veritabanında yoksa PGRST202 (veya "could not find the
// function") döner; bu durumda eski yola düşeriz.
function isMissingRpc(err: { code?: string; message?: string }): boolean {
  return err.code === 'PGRST202' || /could not find the function|function .* does not exist/i.test(err.message ?? '');
}

/* ── GET /api/admin/professionals/[id] ────────────────────────────────────── */
// Düzenleme formu için tek profesyonelin TAM kaydı (+ uzmanlıkları).
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('professionals')
    .select(`*, professional_specialties ( specialties ( id, slug, name ) )`)
    .eq('id', params.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Profesyonel bulunamadı.' }, { status: 404 });
  }

  const { professional_specialties, ...rest } = data as any;
  return NextResponse.json({
    ...rest,
    specialties: (professional_specialties ?? [])
      .map((ps: any) => ps.specialties)
      .filter(Boolean),
  });
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

  // Revalidation hedefini belirlemek için güncelleme ÖNCESİ slug/tipi alıyoruz
  // (slug bu PUT içinde değişebilir — her iki URL'i de tazelemek için).
  const { data: beforeUpdate } = await supabase
    .from('professionals')
    .select(['slug', 'professional_type', ...LIST_AFFECTING_FIELDS].filter((v, i, a) => a.indexOf(v) === i).join(', '))
    .eq('id', params.id)
    .maybeSingle();
  const { data: beforeSpecs } = await supabase
    .from('professional_specialties')
    .select('specialty_id')
    .eq('professional_id', params.id);

  // Tercih edilen yol: tek transaction'lık Postgres fonksiyonu (professionals
  // güncelle + uzmanlıkları değiştir). Bir adım patlarsa hepsi geri alınır →
  // terapist yarım kalmış uzmanlıkla bırakılmaz. Fonksiyon henüz oluşturulmadıysa
  // (supabase/admin_update_professional_rpc.sql) eski 3 adımlı yola düşülür.
  let usedRpc = false;
  {
    const { error: rpcError } = await supabase.rpc('admin_update_professional', {
      p_id: params.id,
      p_fields: cleaned,
      p_specialty_ids: specialtyIds,
    });
    if (!rpcError) {
      usedRpc = true;
    } else if (!isMissingRpc(rpcError)) {
      const status = rpcError.code === 'P0002' ? 404 : rpcError.code === '22023' ? 400 : 500;
      return NextResponse.json({ error: rpcError.message }, { status });
    }
  }

  if (!usedRpc) {
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
  }

  // Admin'den gelen HER güncelleme (statü, görünürlük, öne çıkarma, slug vb.)
  // sonrası public sayfaların ISR önbelleğini anında tazele — aksi halde
  // ana sayfa/liste/detay sayfaları saatlerce eski durumu göstermeye devam
  // eder (bkz. revalidatePublicTherapistPages yorumu). Slug bu istekte
  // değiştiyse eski VE yeni slug'ın sayfası ayrı ayrı tazelenir.
  // Liste kartını / filtreleri etkileyen bir alan (veya uzmanlık seti) değiştiyse
  // tüm liste sayfaları tazelenir; aksi halde (örn. yalnızca about/iletişim)
  // sadece profilin kendi sayfası — gereksiz ISR yazımını önler.
  const before = (beforeUpdate ?? {}) as Record<string, unknown>;
  const listFieldChanged = LIST_AFFECTING_FIELDS.some(
    (k) => k in cleaned && !sameValue(k, cleaned[k], before[k]),
  );
  const oldSpecIds = (beforeSpecs ?? []).map((r: { specialty_id: string }) => r.specialty_id).sort().join(',');
  const newSpecIds = [...(specialtyIds as string[])].sort().join(',');
  const listAffected = !beforeUpdate || listFieldChanged || oldSpecIds !== newSpecIds;

  if (listAffected) {
    revalidatePublicTherapistPages(beforeUpdate ?? undefined);
  } else {
    revalidateProfessionalPageOnly(beforeUpdate ?? undefined);
  }
  const newSlug = cleaned.slug as string | undefined;
  const newType = cleaned.professional_type as string | undefined;
  if ((newSlug && newSlug !== beforeUpdate?.slug) || (newType && newType !== beforeUpdate?.professional_type)) {
    revalidatePublicTherapistPages({
      slug: newSlug ?? beforeUpdate?.slug,
      professional_type: newType ?? beforeUpdate?.professional_type,
    });
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
