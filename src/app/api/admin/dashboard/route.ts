//src/app/api/admin/dashboard/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Dashboard Admin – KPIs en una llamada
 * GET /api/admin/dashboard
 *
 * Responde:
 * {
 *   today: { total, paid, unpaid },
 *   upcoming24h: Appointment[],
 *   revenue: { day, week, month },
 *   payments: { unpaidCount, refundedCount, paidCount },
 *   comments: { visibleCount, latest: Comment[] },
 *   services: { total },
 *   barbers: { total }
 * }
 */

// Helpers de fechas (Semana inicia LUNES)
const startOfDay = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

const endOfDay = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const startOfWeek = (d = new Date()) => {
  const dt = new Date(d);
  const day = (dt.getDay() + 6) % 7; // lunes=0
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
    const next24     = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const [
      // Citas de hoy (por start)
      todayAll,
      todayPaid,
      todayUnpaid,

      // Próximas 24h (no canceladas)
      upcoming24h,

      // Ingresos (sum priceSnapshot) por paidAt en día/semana/mes
      revDay,
      revWeek,
      revMonth,

      // Conteos por estado de pago (globales)
      unpaidCount,
      refundedCount,
      paidCount,

      // Comentarios y recursos
      visibleCommentsCount,
      latestComments,
      servicesTotal,
      barbersTotal,
    ] = await Promise.all([
      prisma.appointment.count({ where: { start: { gte: todayStart, lte: todayEnd } } }),
      prisma.appointment.count({ where: { start: { gte: todayStart, lte: todayEnd }, paymentStatus: 'PAID' } }),
      prisma.appointment.count({ where: { start: { gte: todayStart, lte: todayEnd }, paymentStatus: 'UNPAID' } }),

      prisma.appointment.findMany({
        where: { start: { gte: now, lte: next24 }, status: { not: 'CANCELLED' } },
        orderBy: { start: 'asc' },
        take: 10,
        select: {
          id: true,
          customerName: true,
          whatsapp: true,
          start: true,
          end: true,
          status: true,
          paymentStatus: true,
          barber:  { select: { id: true, name: true } },
          service: { select: { id: true, name: true, price: true } },
        },
      }),

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

      prisma.appointment.count({ where: { paymentStatus: 'UNPAID'   } }),
      prisma.appointment.count({ where: { paymentStatus: 'REFUNDED' } }),
      prisma.appointment.count({ where: { paymentStatus: 'PAID'     } }),

      prisma.comment.count({ where: { visible: true } }),
      prisma.comment.findMany({
        where:   { visible: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, message: true, createdAt: true },
      }),
      prisma.service.count(),
      prisma.barber.count(),
    ]);

    const revenue = {
      day:   revDay._sum?.priceSnapshot   ?? 0,
      week:  revWeek._sum?.priceSnapshot  ?? 0,
      month: revMonth._sum?.priceSnapshot ?? 0,
    };

    return NextResponse.json({
      today:   { total: todayAll, paid: todayPaid, unpaid: todayUnpaid },
      upcoming24h,
      revenue,
      payments: { unpaidCount, refundedCount, paidCount },
      comments: { visibleCount: visibleCommentsCount, latest: latestComments },
      services: { total: servicesTotal },
      barbers:  { total: barbersTotal },
      now: now.toISOString(),
    });
  } catch (e) {
    console.error('DASHBOARD ERROR', e);
    return NextResponse.json({ error: 'dashboard_failed' }, { status: 500 });
  }
}
