// src/app/api/auth/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Ejemplo: actualizar "role" del usuario (porque tu User no tiene "status")
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await req.json() as { role?: 'ADMIN' } // ajusta al campo real que quieras tocar
    if (!body.role) {
      return NextResponse.json({ error: 'Falta campo por actualizar' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role: body.role },
    })

    return NextResponse.json(user)
  } catch (err) {
    console.error('PATCH /api/auth/[id] error', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// (Opcional) GET/DELETE si los necesitas:
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id)
  if (Number.isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  const user = await prisma.user.findUnique({ where: { id } })
  return NextResponse.json(user)
}
