// src/app/api/appointments/summary/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    if (!date) return NextResponse.json({ rows: [], grandTotal: 0 })

    // usar la misma fecha 'date' (00:00:00 implícito porque es @db.Date)
    // Alternativa robusta por husos horarios:
    const dayStart = new Date(`${date}T00:00:00`);
    const dayEnd = new Date(`${date}T23:59:59.999`);

    const paid = await prisma.appointment.findMany({
      where: {
        status: 'COMPLETED',
        // usar start en rango si prefieres no depender de appointmentDate
        start: { gte: dayStart, lte: dayEnd },
      },
      include: { service: true },
    });

    const map = new Map<number, { name: string; count: number; total: number }>()
    for (const a of paid) {
      if (!a.service) continue
      const curr = map.get(a.service.id) ?? { name: a.service.name, count: 0, total: 0 }
      curr.count += 1
      curr.total += a.service.price
      map.set(a.service.id, curr)
    }

    const rows = Array.from(map.entries()).map(([serviceId, v]) => ({
      serviceId, name: v.name, count: v.count, total: v.total
    }))
    const grandTotal = rows.reduce((acc, r) => acc + r.total, 0)

    return NextResponse.json({ rows, grandTotal })
  } catch (err) {
    console.error('GET /api/appointments/summary error', err)
    return NextResponse.json({ rows: [], grandTotal: 0 }, { status: 500 })
  }
}
