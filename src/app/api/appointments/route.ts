import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/appointments?date=YYYY-MM-DD&barberId=1&status=SCHEDULED
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') // YYYY-MM-DD
    const barberId = searchParams.get('barberId')
    const status = searchParams.get('status')

    const where: any = {}

    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`)
      const end = new Date(`${date}T23:59:59.999Z`)
      where.start = { gte: start, lte: end }
    }

    if (barberId && barberId !== 'all') {
      where.barberId = Number(barberId)
    }

    if (status && status !== 'all') {
      where.status = status
    }

    const appts = await prisma.appointment.findMany({
      where,
      orderBy: { start: 'asc' },
      include: {
        barber: true,
        service: true,
      },
    })

    return NextResponse.json(appts)
  } catch (err) {
    console.error('GET /api/appointments error', err)
    return NextResponse.json({ error: 'Error al obtener citas' }, { status: 500 })
  }
}

// (opcional) POST para crear
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { customerName, whatsapp, serviceId, barberId, start, notes } = body

    if (!customerName || !whatsapp || !serviceId || !barberId || !start) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const service = await prisma.service.findUnique({ where: { id: Number(serviceId) } })
    if (!service) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })

    const durationMin = service.duration
    const startDate = new Date(start)
    const endDate = new Date(startDate.getTime() + durationMin * 60_000)

    const appt = await prisma.appointment.create({
      data: {
        customerName,
        whatsapp,
        serviceId: Number(serviceId),
        barberId: Number(barberId),
        start: startDate,
        end: endDate,
        status: 'SCHEDULED',
        notes: notes ?? '',
      },
      include: { barber: true, service: true },
    })

    return NextResponse.json(appt, { status: 201 })
  } catch (err) {
    console.error('POST /api/appointments error', err)
    return NextResponse.json({ error: 'Error al crear cita' }, { status: 500 })
  }
}
