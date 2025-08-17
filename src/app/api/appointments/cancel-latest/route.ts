// src/app/api/appointments/cancel-latest/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'; // ✅ ESTA ES LA BUENA

export async function POST(req: Request) {
  try {
    const { whatsapp } = await req.json()

    if (!whatsapp) {
      return NextResponse.json(
        { error: 'Número de WhatsApp es requerido.' },
        { status: 400 }
      )
    }

    // Buscar la última cita de ese número
    const lastAppointment = await prisma.appointment.findFirst({
      where: { whatsapp },
      orderBy: { start: 'desc' }
    })

    if (!lastAppointment) {
      return NextResponse.json(
        { error: 'No se encontró ninguna cita con ese número.' },
        { status: 404 }
      )
    }

    // Eliminar la cita
    await prisma.appointment.delete({ where: { id: lastAppointment.id } })

    return NextResponse.json({ success: true, deletedId: lastAppointment.id })
  } catch (error) {
    console.error('[CANCEL_LATEST_APPOINTMENT]', error)
    return NextResponse.json(
      { error: 'Ocurrió un error al cancelar la cita.' },
      { status: 500 }
    )
  }
}
