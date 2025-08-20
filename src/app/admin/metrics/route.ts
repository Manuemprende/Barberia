import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const start = new Date(now); start.setHours(0,0,0,0);
    const end   = new Date(now); end.setHours(23,59,59,999);

    const [totalHoy, totalComentarios, totalServicios, proximas] = await Promise.all([
      prisma.appointment.count({ where: { start: { gte: start, lte: end } } }),
      prisma.comment.count(),
      prisma.service.count(),
      prisma.appointment.findMany({ where: { start: { gte: now } }, orderBy: { start: 'asc' }, take: 5 })
    ]);

    return NextResponse.json({ totalHoy, totalComentarios, totalServicios, proximas });
  } catch (e) {
    console.error('METRICS ERROR', e);
    return NextResponse.json({ error: 'metrics_failed' }, { status: 500 });
  }
}
