import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/appointments?date=2025-08-09&barberId=1&status=SCHEDULED
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')       // YYYY-MM-DD
    const barberId = searchParams.get('barberId')
    const status = searchParams.get('status')   // SCHEDULED | CONFIRMED | COMPLETED | CANCELLED | ALL

    const where: any = {}

    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`)
      const end   = new Date(`${date}T23:59:59.999Z`)
      where.start = { gte: start, lte: end }
    }

    if (barberId && barberId !== 'all') {
      where.barberId = Number(barberId)
    }

    if (status && status !== 'all' && status !== 'ALL') {
      where.status = status
    }

    const appts = await prisma.appointment.findMany({
      where,
      orderBy: { start: 'asc' },
      include: { barber: true, service: true },
    })

    // 🔁 El dashboard espera { data, total }
    return NextResponse.json({ data: appts, total: appts.length })
  } catch (err) {
    console.error('GET /api/appointments error', err)
    return NextResponse.json({ error: 'Error al obtener citas' }, { status: 500 })
  }
}

// POST /api/appointments
// Body: { customerName, whatsapp, serviceId, barberId, start(ISO), notes? }
export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      customerName?: string
      whatsapp?: string
      serviceId?: number
      barberId?: number
      start?: string
      notes?: string
    }

    const { customerName, whatsapp, serviceId, barberId, start, notes } = body

    // ✅ Validaciones básicas
    if (!customerName || !whatsapp || !serviceId || !barberId || !start) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    const startDt = new Date(start)
    if (isNaN(startDt.getTime())) {
      return NextResponse.json({ error: 'Fecha/hora inválida' }, { status: 400 })
    }

    // Traer servicio para calcular la hora de término
    const service = await prisma.service.findUnique({
      where: { id: Number(serviceId) },
      select: { duration: true },
    })
    if (!service) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    }

    // Calcular end sumando la duración (minutos)
    const endDt = new Date(startDt.getTime() + service.duration * 60 * 1000)

    // (Opcional) Evitar duplicados por mismo WhatsApp el mismo día
    const dayStart = new Date(startDt)
    dayStart.setUTCHours(0, 0, 0, 0)
    const dayEnd = new Date(startDt)
    dayEnd.setUTCHours(23, 59, 59, 999)

    const dup = await prisma.appointment.findFirst({
      where: {
        whatsapp,
        start: { gte: dayStart, lte: dayEnd },
      },
      select: { id: true },
    })
    if (dup) {
      return NextResponse.json(
        { error: 'Ya existe una cita ese día para este WhatsApp' },
        { status: 409 }
      )
    }

    // Crear cita con estado inicial SCHEDULED
    const created = await prisma.appointment.create({
      data: {
        customerName,
        whatsapp,
        serviceId: Number(serviceId),
        barberId: Number(barberId),
        start: startDt,
        end: endDt,
        status: 'SCHEDULED',
        notes: notes ?? '',
      },
      include: { barber: true, service: true },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error('POST /api/appointments error', err)
    return NextResponse.json({ error: 'Error al crear la cita' }, { status: 500 })
  }
}
