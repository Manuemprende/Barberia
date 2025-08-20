import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') // YYYY-MM-DD

    if (!date) {
      return NextResponse.json({ rows: [], grandTotal: 0 })
    }

    // Día completo en UTC (ajusta si necesitas TZ local)
    const start = new Date(`${date}T00:00:00.000`)
    const end   = new Date(`${date}T23:59:59.999`)

    // Tomamos solo pagadas
    const paid = await prisma.appointment.findMany({
      where: {
        status: 'COMPLETED',
        start: { gte: start, lte: end },
      },
      include: { service: true },
    })

    // Agrupar por servicio
    const map = new Map<number, { name: string; count: number; total: number }>()
    for (const a of paid) {
      const s = a.service
      if (!s) continue
      const curr = map.get(s.id) ?? { name: s.name, count: 0, total: 0 }
      curr.count += 1
      curr.total += s.price
      map.set(s.id, curr)
    }

    const rows = Array.from(map.entries()).map(([serviceId, v]) => ({
      serviceId,
      name: v.name,
      count: v.count,
      total: v.total,
    }))
    const grandTotal = rows.reduce((acc, r) => acc + r.total, 0)

    return NextResponse.json({ rows, grandTotal })
  } catch (err) {
    console.error('GET /api/appointments/summary error', err)
    return NextResponse.json({ rows: [], grandTotal: 0 }, { status: 500 })
  }
}
