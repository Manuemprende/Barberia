import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/appointments/:id  -> actualizar estado
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const apptId = Number(id)
    if (Number.isNaN(apptId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const { status } = (await req.json()) as {
      status?: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
    }
    if (!status) {
      return NextResponse.json({ error: 'Falta status' }, { status: 400 })
    }

    const updated = await prisma.appointment.update({
      where: { id: apptId },
      data: { status },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const apptId = Number(id)
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
