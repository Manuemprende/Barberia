// src/app/api/barbers/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const barbers = await prisma.barber.findMany({ orderBy: { id: 'asc' } })
    return NextResponse.json(barbers)
  } catch (e: any) {
    console.error('GET /api/barbers error:', e)
    return NextResponse.json({ error: 'Error al obtener barberos' }, { status: 500 })
  }
}