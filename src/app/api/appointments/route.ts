import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const normalizePhone = (s: string) => s.replace(/\D+/g, '')

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

    // Validaciones mínimas
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

    // Verificar servicio / barbero existen
    const [service, barber] = await Promise.all([
      prisma.service.findUnique({ where: { id: body.serviceId } }),
      prisma.barber.findUnique({ where: { id: body.barberId } }),
    ])
    if (!service) return NextResponse.json({ error: 'Servicio no existe' }, { status: 400 })
    if (!barber)  return NextResponse.json({ error: 'Barbero no existe' }, { status: 400 })

    // FIN de la cita en base a duración del servicio
    const endDate = new Date(startDate.getTime() + service.duration * 60_000)

    // 1) ❗ Validación en BD: una cita por día por WhatsApp (ignora canceladas)
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

    // 2) Validación solapamiento con el barbero
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

    // Crear cita
    const created = await prisma.appointment.create({
      data: {
        customerName: body.customerName,
        whatsapp: body.whatsapp,
        whatsappNormalized: phoneNorm,  // 👈 guarda normalizado
        barberId: body.barberId,
        serviceId: body.serviceId,
        start: startDate,
        end: endDate,
        appointmentDate: apptDate,      // 👈 guarda fecha del día
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
