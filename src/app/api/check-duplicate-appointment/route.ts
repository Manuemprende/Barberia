// src/app/api/check-duplicate-appointment/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'; // ✅ ESTA ES LA BUENA

export async function POST(req: Request) {
  try {
    const { whatsapp, date } = await req.json()

    if (!whatsapp || !date) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    // Limites de dia completo
    const startOfDay = new Date(date + 'T00:00:00')
    const endOfDay = new Date(date + 'T23:59:59')

    const existing = await prisma.appointment.findFirst({
      where: {
        whatsapp,
        start: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: 'SCHEDULED'
      }
    })

    if (existing) {
      return NextResponse.json({ exists: true })
    }

    return NextResponse.json({ exists: false })
  } catch (error) {
    console.error('Error validando cita duplicada:', error)
    return NextResponse.json({ error: 'Error en el servidor' }, { status: 500 })
  }
}
