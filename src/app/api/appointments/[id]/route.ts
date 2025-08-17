import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Status = 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
const isStatus = (v: any): v is Status =>
  ['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].includes(v)

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apptId = Number(params.id)
    if (Number.isNaN(apptId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await req.json().catch(() => null)
    const status = body?.status
    if (!isStatus(status)) {
      return NextResponse.json({ error: 'Estado inválido o faltante', got: status }, { status: 400 })
    }

    const updated = await prisma.appointment.update({
      where: { id: apptId },
      data: { status },
      include: { barber: true, service: true }
    })

    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('PATCH /api/appointments/[id] error', err)
    return NextResponse.json(
      { error: 'No se pudo actualizar', detail: String(err?.message ?? err) },
      { status: 500 }
    )
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apptId = Number(params.id)
    if (Number.isNaN(apptId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    await prisma.appointment.delete({ where: { id: apptId } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('DELETE /api/appointments/[id] error', err)
    return NextResponse.json(
      { error: 'No se pudo eliminar', detail: String(err?.message ?? err) },
      { status: 500 }
    )
  }
}