// src/app/api/services/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';


// GET /api/services -> listar servicios
export async function GET() {
  try {
    const services = await prisma.service.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(services, { status: 200 });
  } catch (err) {
    console.error('GET /api/services error', err);
    return NextResponse.json({ error: 'Error al obtener servicios' }, { status: 500 });
  }
}

// POST /api/services -> crear servicio
export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => ({}));
    const name = (raw?.name ?? '').toString().trim();
    const price = Number.parseInt(String(raw?.price), 10);
    const duration = Number.parseInt(String(raw?.duration), 10);

    if (!name) {
      return NextResponse.json({ error: 'Falta el nombre del servicio' }, { status: 400 });
    }
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: 'Precio inválido (entero > 0)' }, { status: 400 });
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      return NextResponse.json({ error: 'Duración inválida (minutos > 0)' }, { status: 400 });
    }

    const exists = await prisma.service.findFirst({ where: { name } });
    if (exists) {
      return NextResponse.json({ error: 'Ya existe un servicio con ese nombre' }, { status: 409 });
    }

    const service = await prisma.service.create({
      data: { name, price, duration },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/services error', err);
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Nombre de servicio ya existe' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al crear servicio' }, { status: 500 });
  }
}
