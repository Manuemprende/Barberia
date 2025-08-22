// src/app/api/barbers/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';


// GET /api/barbers -> listar barberos
export async function GET() {
  try {
    const barbers = await prisma.barber.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(barbers, { status: 200 });
  } catch (err) {
    console.error('GET /api/barbers error', err);
    return NextResponse.json({ error: 'Error al obtener barberos' }, { status: 500 });
  }
}

// POST /api/barbers -> crear barbero
export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => ({}));
    const name = (raw?.name ?? '').toString().trim();

    if (!name) {
      return NextResponse.json({ error: 'Falta el nombre del barbero' }, { status: 400 });
    }

    // Evita duplicados por nombre (si agregas @@unique en Prisma, atrapará igual)
    const exists = await prisma.barber.findFirst({ where: { name } });
    if (exists) {
      return NextResponse.json({ error: 'Ya existe un barbero con ese nombre' }, { status: 409 });
    }

    const barber = await prisma.barber.create({ data: { name } });
    return NextResponse.json(barber, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/barbers error', err);
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Nombre de barbero ya existe' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al crear barbero' }, { status: 500 });
  }
}
