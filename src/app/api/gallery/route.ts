import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // ✅ ESTA ES LA BUENA

export async function GET() {
  try {
    const images = await prisma.galleryImage.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al obtener imágenes' }, { status: 500 });
  }
}
