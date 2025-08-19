import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

// PATCH /api/appointments/:id  -> actualizar estado
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const apptId = Number(params.id)
    if (Number.isNaN(apptId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = (await req.json()) as { status?: Prisma.AppointmentUpdateInput['status'] }
    if (!body?.status) {
      return NextResponse.json({ error: 'Falta status' }, { status: 400 })
    }

    const updated = await prisma.appointment.update({
      where: { id: apptId },
      data: { status: body.status },
      include: { barber: true, service: true },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('PATCH /api/appointments/[id] error', err)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

// DELETE /api/appointments/:id  -> eliminar cita
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const apptId = Number(params.id)
    if (Number.isNaN(apptId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    await prisma.appointment.delete({ where: { id: apptId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/appointments/[id] error', err)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
