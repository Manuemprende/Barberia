import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addMinutes, startOfDay, endOfDay, format } from 'date-fns'

type Payload = { barberId: number; serviceId: number; date: string }

export async function POST(req: Request) {
  try {
    const { barberId, serviceId, date } = (await req.json()) as Payload
    if (!barberId || !serviceId || !date) {
      return NextResponse.json([], { status: 200 })
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } })
    if (!service) return NextResponse.json([], { status: 200 })

    const dayStart = startOfDay(new Date(date))
    const dayEnd = endOfDay(new Date(date))

    // ejemplo slots 9:00-19:00 cada 30 min
    const slots: string[] = []
    let cursor = new Date(dayStart)
    cursor.setHours(9, 0, 0, 0)

    while (cursor <= dayEnd && cursor.getHours() < 19) {
      slots.push(format(cursor, 'HH:mm'))
      cursor = addMinutes(cursor, 30)
    }

    const appts = await prisma.appointment.findMany({
      where: {
        barberId,
        start: { gte: dayStart, lte: dayEnd }
      }
    })

    const busy = new Set(
      appts.map(a => format(new Date(a.start), 'HH:mm'))
    )

    const available = slots.filter(t => !busy.has(t))
    return NextResponse.json(available)
  } catch (err) {
    console.error('POST /available-times error', err)
    return NextResponse.json([], { status: 200 })
  }
}
