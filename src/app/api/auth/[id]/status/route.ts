import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }   // 👈 firma correcta, inline
) {
  try {
    const idNum = Number(params.id)
    if (Number.isNaN(idNum)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await req.json() as { status?: string }
    if (!body?.status) {
      return NextResponse.json({ error: 'Falta "status"' }, { status: 400 })
    }

    // Ajusta el modelo/tabla según tu schema (ej.: User / Admin / Appointment, etc.)
    const updated = await prisma.user.update({
      where: { id: idNum },
      data: { status: body.status },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('PATCH /api/auth/[id]/status error', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}