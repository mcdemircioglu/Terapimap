import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/server';
import { verifyAdminRequest } from '@/lib/admin/auth';

function verifyAuth(request: Request): boolean {
  return verifyAdminRequest(request);
}

const MAX_ROWS = 3000;
const CHUNK = 200;

type InRow = {
  slug: unknown;
  impressions: unknown;
  clicks: unknown;
  avg_position: unknown;
  brand_impressions: unknown;
  brand_clicks: unknown;
  top_query: unknown;
};

function toInt(v: unknown): number | null {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) && n >= 0 && n < 1e9 ? Math.round(n) : null;
}
function toPos(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(n) && n >= 0 && n < 1000 ? Math.round(n * 10) / 10 : null;
}
function toDate(v: unknown): string | null {
  const s = String(v ?? '');
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s).getTime()) ? s : null;
}

/* ── POST: GSC özetini yükle ───────────────────────────────────────────────
 * { periodStart, periodEnd, rows: [{ slug, impressions, clicks, avg_position,
 *   brand_impressions, brand_clicks, top_query }], dryRun? }
 * Slug ile profil eşleştirilir. dryRun true ise yazmaz, eşleşme önizlemesi döner.
 * Gerçek yüklemede önceki dönemin satırları silinir (tek anlık görüntü tutulur).
 * ───────────────────────────────────────────────────────────────────────── */
export async function POST(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));

  const periodStart = toDate(body.periodStart);
  const periodEnd = toDate(body.periodEnd);
  if (!periodStart || !periodEnd || periodEnd < periodStart) {
    return NextResponse.json({ error: 'Geçerli bir dönem başlangıç ve bitiş tarihi girin.' }, { status: 400 });
  }
  const raw: unknown = body.rows;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_ROWS) {
    return NextResponse.json({ error: `1-${MAX_ROWS} arası satır gönderin.` }, { status: 400 });
  }
  const dryRun = body.dryRun === true;

  // Girdi doğrulama: geçersiz satırlar atlanır, nedenleri sayılır.
  const clean = new Map<string, {
    impressions: number; clicks: number; avg_position: number | null;
    brand_impressions: number; brand_clicks: number; top_query: string | null;
  }>();
  let skipped = 0;
  for (const r of raw as InRow[]) {
    const slug = String(r?.slug ?? '').trim();
    const impressions = toInt(r?.impressions);
    const clicks = toInt(r?.clicks);
    if (!slug || slug.length > 300 || impressions === null || clicks === null) { skipped++; continue; }
    const q = String(r.top_query ?? '').trim();
    clean.set(slug, {
      impressions,
      clicks,
      avg_position: toPos(r.avg_position),
      brand_impressions: toInt(r.brand_impressions) ?? 0,
      brand_clicks: toInt(r.brand_clicks) ?? 0,
      top_query: q ? q.slice(0, 300) : null,
    });
  }

  const supabase = getServiceClient();
  const slugs = Array.from(clean.keys());
  const idBySlug = new Map<string, string>();
  for (let i = 0; i < slugs.length; i += CHUNK) {
    const { data, error } = await supabase
      .from('professionals')
      .select('id, slug')
      .in('slug', slugs.slice(i, i + CHUNK));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    for (const p of data ?? []) idBySlug.set(p.slug as string, p.id as string);
  }
  const unmatched = slugs.filter((s) => !idBySlug.has(s));

  if (dryRun) {
    return NextResponse.json({
      dryRun: true, matched: idBySlug.size, unmatched: unmatched.slice(0, 50),
      unmatchedCount: unmatched.length, skipped,
    });
  }

  const records = slugs
    .filter((s) => idBySlug.has(s))
    .map((s) => ({
      professional_id: idBySlug.get(s)!,
      period_start: periodStart,
      period_end: periodEnd,
      ...clean.get(s)!,
      updated_at: new Date().toISOString(),
    }));

  for (let i = 0; i < records.length; i += CHUNK) {
    const { error } = await supabase
      .from('professional_gsc_stats')
      .upsert(records.slice(i, i + CHUNK), { onConflict: 'professional_id' });
    if (error) {
      return NextResponse.json(
        { error: `Yazılamadı (tablo oluşturuldu mu?): ${error.message}` },
        { status: 500 },
      );
    }
  }

  // Yeni yüklemede yer almayan eski satırları temizle: eski dönem rakamları
  // yeni mesajlara karışmasın. Bu yükleme aynı dönemi içeriyorsa dokunulmaz.
  const keepIds = records.map((r) => r.professional_id);
  const { data: stale } = await supabase.from('professional_gsc_stats').select('professional_id');
  const keep = new Set(keepIds);
  const staleIds = (stale ?? [])
    .map((s: { professional_id: string }) => s.professional_id)
    .filter((id: string) => !keep.has(id));
  for (let i = 0; i < staleIds.length; i += CHUNK) {
    await supabase.from('professional_gsc_stats').delete().in('professional_id', staleIds.slice(i, i + CHUNK));
  }

  return NextResponse.json({
    ok: true, saved: records.length, unmatched: unmatched.slice(0, 50),
    unmatchedCount: unmatched.length, skipped, removedStale: staleIds.length,
  });
}
