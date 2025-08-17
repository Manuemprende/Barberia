import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'; // ✅ ESTA ES LA BUENA

const WORK_START = 9  // 09:00
const WORK_END   = 19 // 19:00

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const barberId  = Number(searchParams.get('barberId'))
    const serviceId = Number(searchParams.get('serviceId'))
    const dateStr   = searchParams.get('date') // '2025-08-02'

    if (!barberId || !serviceId || !dateStr) {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId } })
    if (!service) return NextResponse.json({ error: 'Servicio no existe' }, { status: 400 })

    const dayStart = new Date(`${dateStr}T00:00:00.000Z`)
    const dayEnd   = new Date(`${dateStr}T23:59:59.999Z`)

    const appts = await prisma.appointment.findMany({
      where: {
        barberId,
        status: 'SCHEDULED',
        OR: [
          { start: { gte: dayStart, lte: dayEnd } },
          { end:   { gte: dayStart, lte: dayEnd } }
        ]
      },
      orderBy: { start: 'asc' }
    })

    const slots: string[] = []
    const stepMs = service.duration * 60_000

    const workStart = new Date(dayStart); workStart.setUTCHours(WORK_START, 0, 0, 0)
    const workEnd   = new Date(dayStart); workEnd.setUTCHours(WORK_END,   0, 0, 0)

    for (let t = workStart.getTime(); t + stepMs <= workEnd.getTime(); t += stepMs) {
      const s = new Date(t)
      const e = new Date(t + stepMs)
      const overlaps = appts.some(a => s < a.end && e > a.start)
      if (!overlaps) slots.push(s.toISOString())
    }

    return NextResponse.json({ slots })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Error calculando disponibilidad' }, { status: 500 })
  }
}
