import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const origin = new URL(req.url).origin;

    const [todayRes, upcomingRes, commentsRes, servicesRes] = await Promise.all([
      fetch(`${origin}/api/appointments?today=1&status=SCHEDULED`, { cache: 'no-store' }),
      fetch(`${origin}/api/appointments?upcoming=1&status=SCHEDULED&limit=5`, { cache: 'no-store' }),
      fetch(`${origin}/api/comments`, { cache: 'no-store' }),
      fetch(`${origin}/api/services`, { cache: 'no-store' }),
    ]);

    const [today, upcoming, comments, services] = await Promise.all([
      todayRes.json().catch(() => []),
      upcomingRes.json().catch(() => []),
      commentsRes.json().catch(() => []),
      servicesRes.json().catch(() => []),
    ]);

    return NextResponse.json({
      totalHoy: Array.isArray(today) ? today.length : 0,
      proximas: Array.isArray(upcoming) ? upcoming : [],
      totalComentarios: Array.isArray(comments) ? comments.length : 0,
      totalServicios: Array.isArray(services) ? services.length : 0,
    });
  } catch (e) {
    console.error('METRICS ERROR', e);
    return NextResponse.json({ error: 'metrics_failed' }, { status: 500 });
  }
}
