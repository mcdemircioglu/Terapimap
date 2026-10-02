import { NextResponse } from 'next/server';
import { getServerClient, getServiceClient } from '@/lib/supabase/server';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * PUT /api/panel/availability
 * Oturumdaki terapistin haftalık çalışma programını, seans süresini ve
 * görüşme linkini kaydeder. Haftalık program tamamen değiştirilir
 * (mevcut kurallar silinip gönderilenlerle değiştirilir) — leads/
 * specialties güncellemelerindeki "delete + insert" deseniyle aynı.
 *
 * Yazma işlemi service-role istemcisiyle yapılır (documents/panel-invite
 * route'larındaki desenle aynı): oturum burada yalnızca HANGİ terapistin
 * kaydını güncelleyeceğimizi doğrulamak için kullanılıyor.
 */
export async function PUT(request: Request) {
  const supabase = getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { data: professional } = await supabase
    .from('professionals')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!professional) {
    return NextResponse.json({ error: 'profile_not_found' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const meetingLink =
    typeof body.meeting_link === 'string' && body.meeting_link.trim() ? body.meeting_link.trim() : null;
  const sessionDuration = Number(body.session_duration_minutes);
  if (!Number.isFinite(sessionDuration) || sessionDuration <= 0 || sessionDuration > 240) {
    return NextResponse.json({ error: 'invalid_session_duration' }, { status: 400 });
  }

  const rawRules = Array.isArray(body.rules) ? body.rules : [];
  const rules: { weekday: number; start_time: string; end_time: string }[] = [];
  for (const r of rawRules) {
    const weekday = Number(r?.weekday);
    const start = String(r?.start_time ?? '');
    const end = String(r?.end_time ?? '');
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      return NextResponse.json({ error: 'invalid_weekday' }, { status: 400 });
    }
    if (!TIME_RE.test(start) || !TIME_RE.test(end) || start >= end) {
      return NextResponse.json({ error: 'invalid_time_range' }, { status: 400 });
    }
    rules.push({ weekday, start_time: start, end_time: end });
  }

  const service = getServiceClient();

  const { error: profErr } = await service
    .from('professionals')
    .update({ meeting_link: meetingLink, session_duration_minutes: sessionDuration })
    .eq('id', professional.id);

  if (profErr) {
    return NextResponse.json({ error: profErr.message }, { status: 500 });
  }

  const { error: delErr } = await service
    .from('availability_rules')
    .delete()
    .eq('professional_id', professional.id);

  if (delErr) {
    return NextResponse.json(
      { error: `Ayarlar kaydedildi ama program temizlenemedi: ${delErr.message}` },
      { status: 500 },
    );
  }

  if (rules.length > 0) {
    const { error: insErr } = await service.from('availability_rules').insert(
      rules.map((r) => ({
        professional_id: professional.id,
        weekday: r.weekday,
        start_time: r.start_time,
        end_time: r.end_time,
      })),
    );
    if (insErr) {
      return NextResponse.json(
        { error: `Ayarlar kaydedildi ama program yazılamadı: ${insErr.message}` },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}
