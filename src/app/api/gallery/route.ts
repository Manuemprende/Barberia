// src/app/api/gallery/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';
export const runtime = 'nodejs';

/**
 * GET /api/gallery
 *  - ?visible=1 -> solo visibles
 *  - ?limit=20  -> limita resultados (máx 100)
 *  - Orden: primero por "order" ASC (nulos al final en Postgres), luego por createdAt DESC
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const onlyVisible = url.searchParams.get('visible') === '1';
    const limitParam = url.searchParams.get('limit');
    const take = (() => {
      const n = Number(limitParam);
      if (!Number.isFinite(n) || n <= 0) return undefined;
      return Math.min(Math.trunc(n), 100);
    })();

    const items = await prisma.galleryImage.findMany({
      where: onlyVisible ? { visible: true } : undefined,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      take,
    });

    return NextResponse.json(items, { status: 200 });
  } catch (e) {
    console.error('GET /gallery error', e);
    return NextResponse.json({ error: 'list_failed' }, { status: 500 });
  }
}

/**
 * POST /api/gallery
 *  Crea un item de galería.
 *
 *  Soporta:
 *  - JSON: { url: string; alt?: string; visible?: boolean; order?: number }
 *  - multipart/form-data:
 *      - file: File (opcional, si vienes con archivo)
 *      - url: string (alternativa si no hay file)
 *      - alt | title: string opcional
 *      - visible: 'true' | 'false' (opcional)
 *      - order: number (opcional)
 *
 *  Si no envías "order", se asigna max(order)+1.
 *  Si envías file, se guarda en /public/uploads y se usa /uploads/filename como url.
 */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let urlValue = '';
    let alt: string | null = null;
    let visible = true as boolean;
    let order: number | null = null;
    let fileFromForm: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      // ---- leer multipart ----
      const form = await req.formData();
      const title = (form.get('title') ?? form.get('alt')) as string | null;
      const urlField = form.get('url') as string | null;
      const visibleField = form.get('visible') as string | null;
      const orderField = form.get('order') as string | null;
      const file = form.get('file');

      if (file instanceof File) fileFromForm = file;

      if (title && String(title).trim()) {
        alt = String(title).trim();
      }

      if (visibleField != null) {
        const s = String(visibleField).trim().toLowerCase();
        if (s === 'true' || s === '1') visible = true;
        else if (s === 'false' || s === '0') visible = false;
      }

      if (orderField != null) {
        const n = Number(orderField);
        if (!Number.isFinite(n) || n < 0) {
          return NextResponse.json({ error: 'order inválido' }, { status: 400 });
        }
        order = Math.trunc(n);
      }

      if (!fileFromForm && urlField) {
        urlValue = String(urlField).trim();
      }
    } else {
      // ---- leer JSON ----
      const raw = await req.json().catch(() => ({}));
      urlValue = (raw?.url ?? '').toString().trim();
      alt = raw?.alt != null ? String(raw.alt) : null;
      if (raw?.visible != null) visible = Boolean(raw.visible);
      if (raw?.order != null) {
        const n = Number(raw.order);
        if (!Number.isFinite(n) || n < 0) {
          return NextResponse.json({ error: 'order inválido' }, { status: 400 });
        }
        order = Math.trunc(n);
      }
    }

    // Si viene archivo, guardarlo y construir urlValue
    if (fileFromForm) {
      const bytes = await fileFromForm.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });

      // nombre de archivo seguro
      const original = fileFromForm.name || 'image';
      const safeName = original.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = `${Date.now()}_${safeName}`;
      const filepath = path.join(uploadDir, filename);

      await fs.writeFile(filepath, buffer);
      urlValue = `/uploads/${filename}`;
    }

    if (!urlValue) {
      return NextResponse.json({ error: 'url requerida (o archivo)' }, { status: 400 });
    }

    // calcular order si no enviaron
    if (order == null) {
      const max = await prisma.galleryImage.aggregate({ _max: { order: true } });
      order = (max._max.order ?? 0) + 1;
    }

    const created = await prisma.galleryImage.create({
      data: { url: urlValue, alt, visible, order },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error('POST /gallery error', e);
    return NextResponse.json({ error: 'create_failed' }, { status: 500 });
  }
}

/**
 * PUT /api/gallery
 *  Reordenado masivo.
 *  Body: { items: Array<{ id: number; order: number }> }
 *  - Actualiza los "order" de varias imágenes a la vez.
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const items = Array.isArray(body?.items) ? body.items : null;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'items requeridos' }, { status: 400 });
    }

    for (const it of items) {
      if (!it || !Number.isFinite(Number(it.id)) || !Number.isFinite(Number(it.order))) {
        return NextResponse.json(
          { error: 'items inválidos: se esperaba { id:number, order:number }' },
          { status: 400 }
        );
      }
    }

    const tx = items.map((it) =>
      prisma.galleryImage.update({
        where: { id: Number(it.id) },
        data: { order: Number(it.order) },
        select: { id: true, order: true },
      })
    );

    const updated = await prisma.$transaction(tx);
    return NextResponse.json({ updated }, { status: 200 });
  } catch (e) {
    console.error('PUT /gallery error', e);
    return NextResponse.json({ error: 'reorder_failed' }, { status: 500 });
  }
}
