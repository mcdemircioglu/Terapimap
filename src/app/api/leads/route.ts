import { NextResponse } from 'next/server';
import { createLead } from '@/lib/queries';

// Basic email check; the DB doesn't validate beyond NOT NULL.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  // Accept the new field name; fall back to the legacy one for compatibility
  // with any callers still sending psychologist_id.
  const professional_id = String(
    body?.professional_id ?? body?.psychologist_id ?? '',
  ).trim();
  const name = String(body?.name ?? '').trim();
  const email = String(body?.email ?? '').trim();
  const phone = body?.phone ? String(body.phone).trim() : null;
  const message = String(body?.message ?? '').trim();

  if (!professional_id || !name || !email || !message) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }
  if (message.length > 4000 || name.length > 200) {
    return NextResponse.json({ error: 'too_long' }, { status: 400 });
  }

  try {
    await createLead({ professional_id, name, email, phone, message });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'server_error', detail: e?.message ?? null },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
