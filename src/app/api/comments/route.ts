import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, message } = body

    if (!name || !message) {
      return NextResponse.json(
        { error: 'Faltan datos' },
        { status: 400 }
      )
    }

    const newComment = await prisma.comment.create({
      data: {
        name,
        message,
      },
    })

    return NextResponse.json(newComment, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const comments = await prisma.comment.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(comments)
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al cargar comentarios' },
      { status: 500 }
    )
  }
}
