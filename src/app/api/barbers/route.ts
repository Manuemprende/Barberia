import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const barbers = await prisma.barber.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(barbers)
  } catch (err) {
    console.error('GET /barbers error', err)
    return NextResponse.json([], { status: 200 })
  }
}
