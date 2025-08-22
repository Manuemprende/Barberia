// src/app/api/admin/metrics/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';

// Helpers de fechas (semana inicia LUNES)
const startOfDay = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

const endOfDay = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const startOfWeek = (d = new Date()) => {
  // lunes = 0
  const dt = new Date(d);
  const day = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - day);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

const endOfWeek = (d = new Date()) => {
  const s = startOfWeek(d);
  return new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6, 23, 59, 59, 999);
};

const startOfMonth = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), 1);

const endOfMonth = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

export async function GET() {
  try {
    const now        = new Date();
    const todayStart = startOfDay(now);
    const todayEnd   = endOfDay(now);
    const weekStart  = startOfWeek(now);
    const weekEnd    = endOfWeek(now);
    const monthStart = startOfMonth(now);
    const monthEnd   = endOfMonth(now);

    // ---- KPIs básicos de hoy ----
    const [totalHoy, pagadasHoy, impagasHoy] = await Promise.all([
      prisma.appointment.count({ where: { start: { gte: todayStart, lte: todayEnd } } }),
      prisma.appointment.count({
        where: { start: { gte: todayStart, lte: todayEnd }, paymentStatus: 'PAID' },
      }),
      prisma.appointment.count({
        where: { start: { gte: todayStart, lte: todayEnd }, paymentStatus: 'UNPAID' },
      }),
    ]);

    // ---- Ingresos (usa priceSnapshot y paidAt dentro del rango) ----
    const [revDay, revWeek, revMonth] = await Promise.all([
      prisma.appointment.aggregate({
        _sum: { priceSnapshot: true },
        where: { paymentStatus: 'PAID', paidAt: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.appointment.aggregate({
        _sum: { priceSnapshot: true },
        where: { paymentStatus: 'PAID', paidAt: { gte: weekStart, lte: weekEnd } },
      }),
      prisma.appointment.aggregate({
        _sum: { priceSnapshot: true },
        where: { paymentStatus: 'PAID', paidAt: { gte: monthStart, lte: monthEnd } },
      }),
    ]);

    // ---- Próximas 24 horas (no canceladas) ----
    const next24 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const upcoming24h = await prisma.appointment.findMany({
      where: { start: { gte: now, lte: next24 }, status: { not: 'CANCELLED' } },
      orderBy: { start: 'asc' },
      take: 5,
      select: {
        id: true,
        start: true,
        end: true,
        status: true,
        customerName: true,
        service: { select: { name: true } },
        barber: { select: { name: true } },
      },
    });

    // ---- Otros contadores ----
    const [visibleComments, totalServicios, totalBarberos] = await Promise.all([
      prisma.comment.count({ where: { visible: true } }),
      prisma.service.count(),
      prisma.barber.count(),
    ]);

    return NextResponse.json({
      today: { total: totalHoy, paid: pagadasHoy, unpaid: impagasHoy },
      revenue: {
        day:   revDay._sum?.priceSnapshot   ?? 0,
        week:  revWeek._sum?.priceSnapshot  ?? 0,
        month: revMonth._sum?.priceSnapshot ?? 0,
      },
      upcoming24h,
      services: { total: totalServicios },
      barbers:  { total: totalBarberos },
      comments: { visibleCount: visibleComments },
      now: now.toISOString(),
    });
  } catch (e) {
    console.error('METRICS ERROR', e);
    return NextResponse.json({ error: 'metrics_failed' }, { status: 500 });
  }
}
