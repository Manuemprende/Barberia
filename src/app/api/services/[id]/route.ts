// src/app/api/services/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/services/:id -> actualizar { name?, price?, duration? }
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const sid = Number(id);
  if (!Number.isFinite(sid)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    const raw = await req.json().catch(() => ({} as any));
    const data: Record<string, any> = {};

    if (typeof raw.name === 'string') {
      const name = raw.name.trim();
      if (!name) return NextResponse.json({ error: 'Nombre vacío' }, { status: 400 });
      data.name = name;
    }

    if (raw.price !== undefined) {
      const price = Number.parseInt(String(raw.price), 10);
      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json({ error: 'Precio inválido (entero > 0)' }, { status: 400 });
      }
      data.price = price;
    }

    if (raw.duration !== undefined) {
      const duration = Number.parseInt(String(raw.duration), 10);
      if (!Number.isFinite(duration) || duration <= 0) {
        return NextResponse.json({ error: 'Duración inválida (minutos > 0)' }, { status: 400 });
      }
      data.duration = duration;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 });
    }

    const updated = await prisma.service.update({ where: { id: sid }, data });
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('PATCH /api/services/[id] error', err);
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'Nombre de servicio ya existe' }, { status: 409 });
    }
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Error al actualizar servicio' }, { status: 500 });
  }
}

// DELETE /api/services/:id
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const sid = Number(id);
  if (!Number.isFinite(sid)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    await prisma.service.delete({ where: { id: sid } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('DELETE /api/services/[id] error', err);
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }
    if (err?.code === 'P2003') {
      return NextResponse.json({ error: 'No se puede eliminar: tiene citas asociadas' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al eliminar servicio' }, { status: 500 });
  }
}
