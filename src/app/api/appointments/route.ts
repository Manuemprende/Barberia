import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const normalizePhone = (s: string) => s.replace(/\D+/g, '');

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

// ------------------------
// GET /api/appointments
// Soporta ?today=1 | ?upcoming=1 | ?status=... | ?limit=100
// Devuelve campos que usa /admin/citas
// ------------------------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const isToday = searchParams.get('today') === '1';
    const isUpcoming = searchParams.get('upcoming') === '1';
    const status = searchParams.get('status') as
      | 'SCHEDULED'
      | 'CONFIRMED'
      | 'CANCELLED'
      | 'COMPLETED'
      | null;
    const limit = Math.max(1, Math.min(Number(searchParams.get('limit') ?? '100'), 500));

    const where: any = {};
    const now = new Date();

    if (isToday) {
      where.start = { gte: startOfDay(now), lte: endOfDay(now) };
    } else if (isUpcoming) {
      where.start = { gte: now }; // próximas desde ahora
      where.status = { not: 'CANCELLED' }; // evita canceladas en "próximas"
    }
    if (status) {
      where.status = status;
    }

    const orderBy =
      isToday || isUpcoming ? { start: 'asc' as const } : { start: 'desc' as const };

    const rows = await prisma.appointment.findMany({
      where,
      orderBy,
      take: limit,
      select: {
        id: true,
        customerName: true,
        whatsapp: true,
        start: true,
        end: true,
        status: true,
        paymentStatus: true,
        paidAt: true,
        barber: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, price: true } },
      },
    });

    return NextResponse.json(rows);
  } catch (e) {
    console.error('GET /api/appointments error', e);
    return NextResponse.json({ error: 'Error al listar' }, { status: 500 });
  }
}

// ------------------------
// POST /api/appointments
// Crea cita (tu código + priceSnapshot)
// ------------------------
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      customerName?: string;
      whatsapp?: string;
      serviceId?: number;
      barberId?: number;
      start?: string; // ISO
      notes?: string;
    };

    if (
      !body?.customerName ||
      !body?.whatsapp ||
      !body?.serviceId ||
      !body?.barberId ||
      !body?.start
    ) {
      return NextResponse.json(
        { error: 'Faltan campos: customerName, whatsapp, serviceId, barberId, start' },
        { status: 400 }
      );
    }

    const startDate = new Date(body.start);
    if (Number.isNaN(startDate.getTime())) {
      return NextResponse.json({ error: 'start inválido' }, { status: 400 });
    }

    const phoneNorm = normalizePhone(body.whatsapp);
    const apptDate = new Date(startDate);
    apptDate.setHours(0, 0, 0, 0);

    const [service, barber] = await Promise.all([
      prisma.service.findUnique({ where: { id: body.serviceId } }),
      prisma.barber.findUnique({ where: { id: body.barberId } }),
    ]);
    if (!service) return NextResponse.json({ error: 'Servicio no existe' }, { status: 400 });
    if (!barber) return NextResponse.json({ error: 'Barbero no existe' }, { status: 400 });

    const endDate = new Date(startDate.getTime() + service.duration * 60_000);

    const dup = await prisma.appointment.findFirst({
      where: {
        whatsappNormalized: phoneNorm,
        appointmentDate: apptDate,
        NOT: { status: 'CANCELLED' },
      },
      select: { id: true },
    });
    if (dup) {
      return NextResponse.json(
        { error: 'Ya existe una cita para este WhatsApp en el mismo día.' },
        { status: 409 }
      );
    }

    const overlap = await prisma.appointment.findFirst({
      where: {
        barberId: body.barberId,
        AND: [{ start: { lt: endDate } }, { end: { gt: startDate } }],
      },
      select: { id: true },
    });
    if (overlap) {
      return NextResponse.json(
        { error: 'El barbero ya tiene una cita en ese horario' },
        { status: 409 }
      );
    }

    const created = await prisma.appointment.create({
      data: {
        customerName: body.customerName,
        whatsapp: body.whatsapp,
        whatsappNormalized: phoneNorm,
        barberId: body.barberId,
        serviceId: body.serviceId,
        start: startDate,
        end: endDate,
        appointmentDate: apptDate,
        status: 'SCHEDULED',
        notes: body.notes ?? null,
        priceSnapshot: service.price, // congela el precio
      },
      include: { barber: true, service: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/appointments error', err);
    return NextResponse.json({ error: 'Error al crear la cita' }, { status: 500 });
  }
}
