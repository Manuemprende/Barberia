import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma' // funciona igual si tienes export default

export async function POST(req: Request) {
  try {
    const body = await req.json() as { title?: string; imageUrl?: string }

    if (!body?.title || !body?.imageUrl) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const newImage = await prisma.galleryImage.create({
      data: { title: body.title, imageUrl: body.imageUrl }
    })

    return NextResponse.json(newImage, { status: 201 })
  } catch (err) {
    console.error('POST /api/gallery/upload error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
