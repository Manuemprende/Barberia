// src/app/api/comments/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const revalidate = 0;

// PATCH /api/comments/[id]  -> { visible?: boolean }
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const cid = Number(id);
    if (!Number.isFinite(cid)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({} as any));
    if (typeof body.visible === 'undefined') {
      return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 });
    }

    const updated = await prisma.comment.update({
      where: { id: cid },
      data: { visible: Boolean(body.visible) },
      select: { id: true, visible: true },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }
    console.error('PATCH /api/comments/[id] error', err);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

// DELETE /api/comments/[id]
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const cid = Number(id);
    if (!Number.isFinite(cid)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await prisma.comment.delete({ where: { id: cid } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }
    console.error('DELETE /api/comments/[id] error', err);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
