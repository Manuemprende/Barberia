// src/app/api/gallery/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const items = await prisma.galleryImage.findMany({ orderBy: { id: 'desc' } })
    return NextResponse.json(items)
  } catch (e: any) {
    console.error('GET /api/gallery error:', e)
    return NextResponse.json({ error: 'Error al obtener galería' }, { status: 500 })
  }
}
