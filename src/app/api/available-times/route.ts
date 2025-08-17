import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'; // ✅ ESTA ES LA BUENA
import { startOfDay, endOfDay, addMinutes, isBefore, format } from 'date-fns'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { barberId, serviceId, date } = body

    if (!barberId || !serviceId || !date) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } })
    if (!service) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 })
    }

    const duration = service.duration

    const dayStart = startOfDay(new Date(date))
    const dayEnd = endOfDay(new Date(date))

    // Obtener citas existentes del barbero para ese día
    const appointments = await prisma.appointment.findMany({
      where: {
        barberId,
        start: { gte: dayStart, lt: dayEnd },
        status: 'SCHEDULED'
      },
      select: {
        start: true,
        end: true
      }
    })

    // Crear bloques de 15 minutos entre 09:00 y 20:00
    const openingHour = 9
    const closingHour = 20
    const slots: string[] = []

    const slotStart = new Date(`${date}T${openingHour.toString().padStart(2, '0')}:00:00`)
    const slotEnd = new Date(`${date}T${closingHour.toString().padStart(2, '0')}:00:00`)

    let current = new Date(slotStart)

    while (addMinutes(current, duration) <= slotEnd) {
      const startTime = new Date(current)
      const endTime = addMinutes(startTime, duration)

      const overlaps = appointments.some(appt => {
        return startTime < appt.end && endTime > appt.start
      })

      if (!overlaps) {
        slots.push(format(startTime, 'HH:mm'))
      }

      current = addMinutes(current, 15)
    }

    return NextResponse.json(slots)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error consultando disponibilidad' }, { status: 500 })
  }
}
