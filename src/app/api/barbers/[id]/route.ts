// src/app/api/barbers/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/barbers/:id  -> actualizar nombre
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const bid = Number(id);
  if (!Number.isFinite(bid)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    const raw = await req.json().catch(() => ({} as any));
    if (typeof raw.name !== 'string') {
      return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 });
    }
    const name = raw.name.trim();
    if (!name) {
      return NextResponse.json({ error: 'Nombre vacío' }, { status: 400 });
    }

    const updated = await prisma.barber.update({
      where: { id: bid },
      data: { name },
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('PATCH /api/barbers/[id] error', err);
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Nombre de barbero ya existe' }, { status: 409 });
    }
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Error al actualizar barbero' }, { status: 500 });
  }
}

// DELETE /api/barbers/:id  -> borrar barbero
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const bid = Number(id);
  if (!Number.isFinite(bid)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    await prisma.barber.delete({ where: { id: bid } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('DELETE /api/barbers/[id] error', err);
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 });
    }
    if (err?.code === 'P2003') {
      return NextResponse.json({ error: 'No se puede eliminar: tiene citas asociadas' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al eliminar barbero' }, { status: 500 });
  }
}
