import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const images = await prisma.galleryImage.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(images)
  } catch (err) {
    console.error('GET /gallery error', err)
    return NextResponse.json([], { status: 200 })
  }
}
