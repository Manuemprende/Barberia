import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/services -> listar servicios
export async function GET() {
  try {
    const services = await prisma.service.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(services)
  } catch (err) {
    console.error('GET /api/services error', err)
    return NextResponse.json({ error: 'Error al obtener servicios' }, { status: 500 })
  }
}

// POST /api/services -> crear servicio
export async function POST(req: Request) {
  try {
    const body = await req.json() as { name?: string; duration?: number; price?: number }

    if (!body?.name || !body?.duration || !body?.price) {
      return NextResponse.json({ error: 'Faltan campos (name, duration, price)' }, { status: 400 })
    }

    const service = await prisma.service.create({
      data: {
        name: body.name,
        duration: body.duration,
        price: body.price,
      },
    })

    return NextResponse.json(service)
  } catch (err) {
    console.error('POST /api/services error', err)
    return NextResponse.json({ error: 'Error al crear servicio' }, { status: 500 })
  }
}
