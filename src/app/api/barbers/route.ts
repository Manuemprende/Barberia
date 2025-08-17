// ✅ 1. Endpoint: Obtener todos los barberos
// Archivo: src/app/api/barbers/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'; // ✅ ESTA ES LA BUENA


export async function GET() {
  try {
    const barbers = await prisma.barber.findMany()
    return NextResponse.json(barbers)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener barberos' }, { status: 500 })
  }
}
