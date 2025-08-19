import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const comments = await prisma.comment.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(comments)
  } catch (err) {
    console.error('GET /comments error', err)
    return NextResponse.json([], { status: 200 })
  }
}

type CreateComment = { name: string; message: string }

export async function POST(req: Request) {
  try {
    const { name, message } = (await req.json()) as CreateComment
    if (!name?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }
    const created = await prisma.comment.create({ data: { name, message } })
    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    console.error('POST /comments error', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
