/**
 * GET /api/debug
 * Diagnostic endpoint — open in browser while dev server is running.
 * REMOVE BEFORE DEPLOYING TO PRODUCTION.
 */
import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const results: Record<string, unknown> = {
    env: {
      NEXT_PUBLIC_SUPABASE_URL: url ? `${url.slice(0, 30)}…` : '❌ MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: key ? `${key.slice(0, 20)}…` : '❌ MISSING',
    },
  };

  if (!url || !key) {
    return NextResponse.json({ ...results, fatal: 'env vars missing' }, { status: 500 });
  }

  const supabase = getServerClient();

  // ── 1. Raw professionals (no filters) ───────────────────────────────
  {
    const { data, error, count } = await supabase
      .from('professionals')
      .select('id, name, is_featured, professional_type', { count: 'exact' })
      .limit(5);
    results['1_professionals_raw'] = error ? { error } : { count, sample: data };
  }

  // ── 2. professionals where is_featured = true ────────────────────────
  {
    const { data, error, count } = await supabase
      .from('professionals')
      .select('id, name, is_featured', { count: 'exact' })
      .eq('is_featured', true)
      .limit(5);
    results['2_professionals_featured'] = error ? { error } : { count, sample: data };
  }

  // ── 3. specialties table ─────────────────────────────────────────────
  {
    const { data, error, count } = await supabase
      .from('specialties')
      .select('*', { count: 'exact' })
      .limit(5);
    results['3_specialties'] = error ? { error } : { count, sample: data };
  }

  // ── 4. professional_specialties table ────────────────────────────────
  {
    const { data, error, count } = await supabase
      .from('professional_specialties')
      .select('*', { count: 'exact' })
      .limit(5);
    results['4_professional_specialties'] = error ? { error } : { count, sample: data };
  }

  // ── 5. Full join (the real query the app uses) ───────────────────────
  {
    const { data, error } = await supabase
      .from('professionals')
      .select(`
        id, name,
        professional_specialties (
          specialties ( id, slug, name )
        )
      `)
      .limit(3);
    results['5_professionals_with_join'] = error ? { error } : { sample: data };
  }

  // ── 6. leads table (write-path sanity check) ─────────────────────────
  {
    const { error } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true });
    results['6_leads_accessible'] = error ? { error } : { ok: true };
  }

  return NextResponse.json(results, { status: 200 });
}
