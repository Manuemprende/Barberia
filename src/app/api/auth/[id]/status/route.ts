// src/app/api/auth/[id]/status/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: { id: string } }

export async function PATCH(req: Request, { params }: Params) {
  try {
    const userId = Number(params.id)
    if (Number.isNaN(userId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    // Puedes usar "status" (string) o "isActive" (boolean), como prefieras.
    // Aquí soportamos ambos por compatibilidad.
    const { status, isActive } = body as {
      status?: string
      isActive?: boolean
    }

    // Construimos el data a actualizar según lo que venga
    const data: Record<string, any> = {}
    if (typeof status === 'string') data.status = status
    if (typeof isActive === 'boolean') data.isActive = isActive

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'Faltan campos para actualizar (status o isActive)' },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, status: true, isActive: true },
    })

    return NextResponse.json(user, { status: 200 })
  } catch (err) {
    console.error('PATCH /api/auth/[id]/status error', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
