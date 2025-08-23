// src/app/api/comments/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: solo devuelve comentarios visibles
export async function GET() {
  try {
    const comments = await prisma.comment.findMany({
      where: { visible: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(comments)
  } catch (err) {
    console.error('GET /comments error', err)
    return NextResponse.json([], { status: 200 })
  }
}

type CreateComment = { name: string; message: string }

// POST: crea comentario con visible: true por defecto
export async function POST(req: Request) {
  try {
    const { name, message } = (await req.json()) as CreateComment
    if (!name?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }
    const created = await prisma.comment.create({
      data: { name, message, visible: true },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error('POST /comments error', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
