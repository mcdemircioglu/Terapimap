import { NextResponse } from 'next/server';
import { isAdminLockedOut, verifyAdminPassword } from '@/lib/admin/auth';

export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { ok: false, error: 'ADMIN_PASSWORD environment variable is not set.' },
      { status: 500 },
    );
  }
  if (isAdminLockedOut(request)) {
    return NextResponse.json(
      { ok: false, error: 'Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin.' },
      { status: 429, headers: { 'Retry-After': '900' } },
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad request.' }, { status: 400 });
  }

  if (verifyAdminPassword(request, body?.password)) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: false, error: 'Invalid password.' }, { status: 401 });
}
