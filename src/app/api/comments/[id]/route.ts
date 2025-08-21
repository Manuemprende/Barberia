import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/comments/:id  ->  { visible?: boolean, name?: string, message?: string }
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const cid = Number(id);
  if (!Number.isFinite(cid)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    const raw = await req.json().catch(() => ({} as any));
    const data: Record<string, any> = {};

    if (raw.visible !== undefined) {
      data.visible = Boolean(raw.visible);
    }
    if (typeof raw.name === 'string') {
      const name = raw.name.trim();
      if (!name) return NextResponse.json({ error: 'Nombre vacío' }, { status: 400 });
      data.name = name;
    }
    if (typeof raw.message === 'string') {
      const msg = raw.message.trim();
      if (!msg) return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 });
      data.message = msg;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 });
    }

    const updated = await prisma.comment.update({
      where: { id: cid },
      data,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }
    console.error('PATCH /comments/[id] error', err);
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }
}

// DELETE /api/comments/:id
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const cid = Number(id);
  if (!Number.isFinite(cid)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    await prisma.comment.delete({ where: { id: cid } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return NextResponse.json({ error: 'Comentario no encontrado' }, { status: 404 });
    }
    console.error('DELETE /comments/[id] error', err);
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
  }
}
