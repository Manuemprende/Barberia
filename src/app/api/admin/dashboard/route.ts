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

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfWeek(d = new Date()) {
  // Lunes como inicio de semana
  const x = new Date(d);
  const day = x.getDay(); // 0 dom .. 6 sáb
  const diff = (day === 0 ? -6 : 1 - day); // mover a lunes
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function sumAppointmentsRows(rows: Array<{ priceSnapshot: number; service?: { price: number } | null }>) {
  return rows.reduce((acc, r) => {
    const val = r.priceSnapshot && r.priceSnapshot > 0 ? r.priceSnapshot : (r.service?.price ?? 0);
    return acc + (val || 0);
  }, 0);
}

export async function GET() {
  try {
    const now = new Date();
    const d0 = startOfDay(now);
    const d1 = endOfDay(now);

    const w0 = startOfWeek(now);
    const m0 = startOfMonth(now);

    const next24 = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Ejecutamos todo en paralelo para máxima velocidad
    const [
      // Citas de hoy (totales y por pago)
      todayAll,
      todayPaid,
      todayUnpaid,

      // Próximas 24h
      upcoming24h,

      // Ingresos por período (solo PAID)
      revenueDayRows,
      revenueWeekRows,
      revenueMonthRows,

      // Pagos conteo
      unpaidCount,
      refundedCount,
      paidCount,

      // Comentarios y servicios / barberos
      visibleCommentsCount,
      latestComments,
      servicesTotal,
      barbersTotal,
    ] = await Promise.all([
      prisma.appointment.count({ where: { start: { gte: d0, lte: d1 } } }),
      prisma.appointment.count({ where: { start: { gte: d0, lte: d1 }, paymentStatus: 'PAID' } }),
      prisma.appointment.count({ where: { start: { gte: d0, lte: d1 }, paymentStatus: 'UNPAID' } }),

      prisma.appointment.findMany({
        where: {
          start: { gte: now, lte: next24 },
          status: { not: 'CANCELLED' },
        },
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
          barber: { select: { id: true, name: true } },
          service: { select: { id: true, name: true, price: true } },
        },
      }),

      prisma.appointment.findMany({
        where: { paymentStatus: 'PAID', start: { gte: d0, lte: d1 } },
        select: { priceSnapshot: true, service: { select: { price: true } } },
      }),
      prisma.appointment.findMany({
        where: { paymentStatus: 'PAID', start: { gte: w0, lte: now } },
        select: { priceSnapshot: true, service: { select: { price: true } } },
      }),
      prisma.appointment.findMany({
        where: { paymentStatus: 'PAID', start: { gte: m0, lte: now } },
        select: { priceSnapshot: true, service: { select: { price: true } } },
      }),

      prisma.appointment.count({ where: { paymentStatus: 'UNPAID' } }),
      prisma.appointment.count({ where: { paymentStatus: 'REFUNDED' } }),
      prisma.appointment.count({ where: { paymentStatus: 'PAID' } }),

      prisma.comment.count({ where: { visible: true } }),
      prisma.comment.findMany({
        where: { visible: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, message: true, createdAt: true },
      }),
      prisma.service.count(),
      prisma.barber.count(),
    ]);

    const revenue = {
      day:   sumAppointmentsRows(revenueDayRows),
      week:  sumAppointmentsRows(revenueWeekRows),
      month: sumAppointmentsRows(revenueMonthRows),
    };

    return NextResponse.json({
      today: { total: todayAll, paid: todayPaid, unpaid: todayUnpaid },
      upcoming24h,
      revenue,
      payments: { unpaidCount, refundedCount, paidCount },
      comments: { visibleCount: visibleCommentsCount, latest: latestComments },
      services: { total: servicesTotal },
      barbers: { total: barbersTotal },
      now,
    });
  } catch (e) {
    console.error('DASHBOARD ERROR', e);
    return NextResponse.json({ error: 'dashboard_failed' }, { status: 500 });
  }
}
