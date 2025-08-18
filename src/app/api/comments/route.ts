// src/app/api/comments/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const comments = await prisma.comment.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(comments)
  } catch (e: any) {
    console.error('GET /api/comments error:', e)
    return NextResponse.json({ error: 'Error al obtener comentarios' }, { status: 500 })
  }
}
