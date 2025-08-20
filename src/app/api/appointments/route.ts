import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const normalizePhone = (s: string) => s.replace(/\D+/g, '')

// ---------- POST: crear cita (tu código, sin cambios)
export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      customerName?: string
      whatsapp?: string
      serviceId?: number
      barberId?: number
      start?: string  // ISO
      notes?: string
    }

    if (!body?.customerName || !body?.whatsapp || !body?.serviceId || !body?.barberId || !body?.start) {
      return NextResponse.json(
        { error: 'Faltan campos: customerName, whatsapp, serviceId, barberId, start' },
        { status: 400 }
      )
    }

    const startDate = new Date(body.start)
    if (Number.isNaN(startDate.getTime())) {
      return NextResponse.json({ error: 'start inválido' }, { status: 400 })
    }

    const phoneNorm = normalizePhone(body.whatsapp)
    const apptDate = new Date(startDate); apptDate.setHours(0,0,0,0)

    const [service, barber] = await Promise.all([
      prisma.service.findUnique({ where: { id: body.serviceId } }),
      prisma.barber.findUnique({ where: { id: body.barberId } }),
    ])
    if (!service) return NextResponse.json({ error: 'Servicio no existe' }, { status: 400 })
    if (!barber)  return NextResponse.json({ error: 'Barbero no existe' }, { status: 400 })

    const endDate = new Date(startDate.getTime() + service.duration * 60_000)

    const dup = await prisma.appointment.findFirst({
      where: {
        whatsappNormalized: phoneNorm,
        appointmentDate: apptDate,
        NOT: { status: 'CANCELLED' },
      },
      select: { id: true }
    })
    if (dup) {
      return NextResponse.json(
        { error: 'Ya existe una cita para este WhatsApp en el mismo día.' },
        { status: 409 }
      )
    }

    const overlap = await prisma.appointment.findFirst({
      where: {
        barberId: body.barberId,
        AND: [{ start: { lt: endDate } }, { end: { gt: startDate } }],
      },
      select: { id: true },
    })
    if (overlap) {
      return NextResponse.json(
        { error: 'El barbero ya tiene una cita en ese horario' },
        { status: 409 }
      )
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
      },
      include: { barber: true, service: true },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error('POST /api/appointments error', err)
    return NextResponse.json({ error: 'Error al crear la cita' }, { status: 500 })
  }
}

// ---------- GET: listar citas (para dashboard/consulta)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const sp = url.searchParams

    // filtros opcionales
    const from = sp.get('from')         // ISO
    const to = sp.get('to')             // ISO
    const status = sp.get('status')     // SCHEDULED|CONFIRMED|CANCELLED|COMPLETED
    const upcoming = sp.get('upcoming') // '1' -> solo futuras
    const today = sp.get('today')       // '1' -> solo hoy (según tz del server)
    const limit = Math.min(parseInt(sp.get('limit') || '10', 10), 100)

    const where: any = {}

    if (status) where.status = status

    if (today === '1') {
      const now = new Date()
      const startDay = new Date(now); startDay.setHours(0,0,0,0)
      const endDay = new Date(now);   endDay.setHours(23,59,59,999)
      where.start = { gte: startDay, lte: endDay }
    } else {
      if (from) {
        const d = new Date(from)
        if (!Number.isNaN(d.getTime())) {
          where.start = { ...(where.start || {}), gte: d }
        }
      }
      if (to) {
        const d = new Date(to)
        if (!Number.isNaN(d.getTime())) {
          where.start = { ...(where.start || {}), lte: d }
        }
      }
    }

    if (upcoming === '1') {
      const now = new Date()
      where.start = { ...(where.start || {}), gte: now }
    }

    const items = await prisma.appointment.findMany({
      where,
      orderBy: { start: 'asc' },
      take: limit,
      include: { barber: true, service: true },
    })

    return NextResponse.json(items)
  } catch (err) {
    console.error('GET /api/appointments error', err)
    return NextResponse.json({ error: 'Error al listar' }, { status: 500 })
  }
}
