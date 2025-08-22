// src/app/api/gallery/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';


// Convierte valores variados a booleano (true/false/"true"/"false"/1/0)
function toBool(v: unknown): boolean | null {
  if (v === true || v === false) return v;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === 'true') return true;
    if (s === 'false') return false;
  }
  if (typeof v === 'number') {
    if (v === 1) return true;
    if (v === 0) return false;
  }
  return null;
}

/**
 * PATCH /api/gallery/[id]
 * Body permitido: { url?: string; alt?: string | null; visible?: boolean; order?: number }
 */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const gid = Number(id);
    if (!Number.isFinite(gid)) {
      return NextResponse.json({ error: 'bad_id' }, { status: 400 });
    }

    const raw = await req.json().catch(() => ({} as any));
    const data: Record<string, any> = {};

    if (raw.url !== undefined) {
      const url = String(raw.url).trim();
      if (!url) return NextResponse.json({ error: 'url vacía' }, { status: 400 });
      data.url = url;
    }

    if (raw.alt !== undefined) {
      data.alt = raw.alt === null ? null : String(raw.alt);
    }

    if (raw.visible !== undefined) {
      const b = toBool(raw.visible);
      if (b === null) return NextResponse.json({ error: 'visible inválido' }, { status: 400 });
      data.visible = b;
    }

    if (raw.order !== undefined) {
      const n = Number(raw.order);
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json({ error: 'order inválido' }, { status: 400 });
      }
      data.order = Math.trunc(n);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'sin_cambios' }, { status: 400 });
    }

    const updated = await prisma.galleryImage.update({
      where: { id: gid },
      data,
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (e: any) {
    if (e?.code === 'P2025') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    console.error('PATCH /api/gallery/[id] error', e);
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }
}

/**
 * DELETE /api/gallery/[id]
 */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const gid = Number(id);
    if (!Number.isFinite(gid)) {
      return NextResponse.json({ error: 'bad_id' }, { status: 400 });
    }

    await prisma.galleryImage.delete({ where: { id: gid } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    if (e?.code === 'P2025') {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    console.error('DELETE /api/gallery/[id] error', e);
    return NextResponse.json({ error: 'delete_failed' }, { status: 500 });
  }
}
