import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/appointments/123/status  { status: "CANCELLED" | "COMPLETED" }
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await req.json()
    const status = body?.status as 'SCHEDULED' | 'CANCELLED' | 'COMPLETED'

    if (!status) {
      return NextResponse.json({ error: 'Estado requerido' }, { status: 400 })
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'No se pudo actualizar la cita' }, { status: 500 })
  }
}
