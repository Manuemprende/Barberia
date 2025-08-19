import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

// GET /api/appointments?date=YYYY-MM-DD&barberId=1&status=SCHEDULED
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const barberId = searchParams.get('barberId')
    const status = searchParams.get('status') as Prisma.AppointmentWhereInput['status'] | null

    const where: Prisma.AppointmentWhereInput = {}

    if (date) {
      const start = new Date(`${date}T00:00:00`)
      const end = new Date(`${date}T23:59:59.999`)
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
      include: { barber: true, service: true },
    })

    // Formato estable { data, total }
    return NextResponse.json({ data: appts, total: appts.length })
  } catch (err) {
    console.error('GET /api/appointments error', err)
    return NextResponse.json({ error: 'Error al obtener citas' }, { status: 500 })
  }
}
