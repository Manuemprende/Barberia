import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// PATCH /api/appointments/:id
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({} as any)) as {
      status?: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
      paymentStatus?: 'UNPAID' | 'PAID' | 'REFUNDED';
    };

    const data: Prisma.AppointmentUpdateInput = {};

    if (body.status) data.status = body.status as any;

    if (body.paymentStatus) {
      data.paymentStatus = body.paymentStatus as any;
      if (body.paymentStatus === 'PAID') {
        data.paidAt = new Date();
      } else if (body.paymentStatus === 'UNPAID') {
        data.paidAt = null;
      }
      // REFUNDED: mantenemos paidAt (histórico de pago), opcional si quieres null.
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data,
      include: { barber: true, service: true },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error('PATCH /appointments/[id] error', e);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

// DELETE /api/appointments/:id (lo que ya tenías)
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /appointments/[id] error', e);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
