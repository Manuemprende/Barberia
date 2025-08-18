// src/app/api/services/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const services = await prisma.service.findMany({ orderBy: { id: 'asc' } })
    return NextResponse.json(services)
  } catch (e: any) {
    console.error('GET /api/services error:', e)
    return NextResponse.json({ error: 'Error al obtener servicios' }, { status: 500 })
  }
}