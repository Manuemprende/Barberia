// src/app/api/appointments/cancel-latest/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const startOfDay = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

const normalize = (s: string) => s.replace(/\D+/g, '');

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { whatsapp?: string };
    const raw = (body.whatsapp ?? '').toString().trim();
    const phone = normalize(raw);

    if (!phone || phone.length < 8) {
      return NextResponse.json(
        { error: 'Número de WhatsApp inválido' },
        { status: 400 }
      );
    }

    const now = new Date();
    const dayStart = startOfDay(now);
    const dayEnd = endOfDay(now);

    let last: { id: number } | null = null;

    // 1) Intento con whatsappNormalized (si existe en tu schema)
    try {
      last = await prisma.appointment.findFirst({
        where: {
          start: { gte: dayStart, lte: dayEnd },
          // @ts-ignore — por si el client de prisma no tiene esta prop
          whatsappNormalized: phone,
        } as any,
        select: { id: true },
        orderBy: { start: 'desc' },
      });
    } catch {
      // Si la columna no existe, seguimos con la alternativa
    }

    // 2) Alternativa: comparar con "whatsapp" (texto guardado con o sin +)
    if (!last) {
      last = await prisma.appointment.findFirst({
        where: {
          start: { gte: dayStart, lte: dayEnd },
          OR: [
            { whatsapp: { contains: phone } }, // por si está guardado "+56..."
            { whatsapp: `+${phone}` },
            { whatsapp: phone },
          ],
        },
        select: { id: true },
        orderBy: { start: 'desc' },
      });
    }

    if (!last) {
      return NextResponse.json(
        { error: 'No hay citas de hoy para ese número.' },
        { status: 404 }
      );
    }

    await prisma.appointment.delete({ where: { id: last.id } });

    return NextResponse.json({ success: true, deletedId: last.id });
  } catch (err) {
    console.error('POST /api/appointments/cancel-latest error', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
