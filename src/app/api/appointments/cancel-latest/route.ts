// src/app/api/appointments/cancel-latest/route.ts
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


const normalizePhone = (s: string) => s.replace(/\D+/g, '');

export async function POST(req: Request) {
  try {
    const { whatsapp } = await req.json().catch(() => ({} as any));

    if (!whatsapp || typeof whatsapp !== 'string' || !whatsapp.trim()) {
      return NextResponse.json(
        { error: 'Número de WhatsApp es requerido.' },
        { status: 400 }
      );
    }

    const phoneNorm = normalizePhone(whatsapp);

    // Última cita de ese número que NO esté cancelada
    const lastAppointment = await prisma.appointment.findFirst({
      where: {
        whatsappNormalized: phoneNorm,
        status: { not: 'CANCELLED' },
      },
      orderBy: { start: 'desc' },
      select: { id: true, status: true },
    });

    if (!lastAppointment) {
      return NextResponse.json(
        { error: 'No se encontró ninguna cita activa con ese número.' },
        { status: 404 }
      );
    }

    // Opción A (recomendada): marcar como CANCELLED
    const updated = await prisma.appointment.update({
      where: { id: lastAppointment.id },
      data: { status: 'CANCELLED' },
      select: { id: true, status: true },
    });

    // Opción B (si de verdad quieres eliminar):
    // await prisma.appointment.delete({ where: { id: lastAppointment.id } });

    return NextResponse.json({ success: true, id: updated.id, status: updated.status });
  } catch (error) {
    console.error('[CANCEL_LATEST_APPOINTMENT]', error);
    return NextResponse.json(
      { error: 'Ocurrió un error al cancelar la cita.' },
      { status: 500 }
    );
  }
}
