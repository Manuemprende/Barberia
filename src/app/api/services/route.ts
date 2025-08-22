// src/app/api/services/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// LISTAR servicios
export async function GET() {
  try {
    const rows = await prisma.service.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(rows, { status: 200 });
  } catch (err) {
    console.error('GET /api/services error', err);
    // devolver array aunque haya error para no romper el .map() del frontend
    return NextResponse.json([], { status: 200 });
  }
}

// CREAR servicio (lo usa el admin rápido)
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const name = String(body?.name ?? '').trim();
    const price = Number.parseInt(String(body?.price ?? ''), 10);
    const duration = Number.parseInt(String(body?.duration ?? ''), 10);

    if (!name || !Number.isFinite(price) || price <= 0 || !Number.isFinite(duration) || duration <= 0) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    const created = await prisma.service.create({ data: { name, price, duration } });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/services error', err);
    return NextResponse.json({ error: 'create_failed' }, { status: 500 });
  }
}
