import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const services = await prisma.service.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(services)
  } catch (err) {
    console.error('GET /services error', err)
    return NextResponse.json([], { status: 200 })
  }
}
