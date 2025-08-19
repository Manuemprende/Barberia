// src/app/api/auth/[id]/status/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// (Opcional) Limita los estados permitidos. Ajusta según tu schema.
// Si tu modelo usa otro enum (p.ej. "ENABLED" | "DISABLED"), cámbialos acá.
const ALLOWED_STATUSES = ['ACTIVE', 'BLOCKED', 'DISABLED'] as const
type AllowedStatus = (typeof ALLOWED_STATUSES)[number]

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // ⚠️ Asegúrate de que el modelo se llama "User" y que tiene la columna "status".
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, status: true, name: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (err) {
    console.error('GET /api/auth/[id]/status error', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } } // ✅ firma correcta
) {
  try {
    const id = Number(params.id)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = (await req.json()) as { status?: string }
    const status = body?.status?.toUpperCase() as AllowedStatus | undefined
    if (!status) {
      return NextResponse.json({ error: 'Falta "status"' }, { status: 400 })
    }

    // (Opcional) valida contra una lista de estados permitidos
    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Status inválido. Permitidos: ${ALLOWED_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // ⚠️ Asegúrate de que el modelo se llama "User" y existe el campo "status".
    const updated = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, email: true, status: true, name: true },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('PATCH /api/auth/[id]/status error', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
