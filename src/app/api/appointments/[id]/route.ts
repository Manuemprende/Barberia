import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Tipos de estado válidos
type Status = 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const apptId = Number(params.id);
    if (!Number.isFinite(apptId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      status?: Status;
      setPaidNow?: boolean;
      unsetPaid?: boolean;
    };

    // Construimos el update de forma condicional
    const data: any = {};

    if (body.status) {
      data.status = body.status;
    }
    if (body.setPaidNow) {
      data.paymentStatus = 'PAID';
      data.paidAt = new Date();
    }
    if (body.unsetPaid) {
      data.paymentStatus = 'UNPAID';
      data.paidAt = null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Sin cambios' }, { status: 400 });
    }

    const updated = await prisma.appointment.update({
      where: { id: apptId },
      data,
      select: {
        id: true,
        customerName: true,
        whatsapp: true,
        start: true,
        end: true,
        status: true,
        paymentStatus: true,
        paidAt: true,
        barber: { select: { id: true, name: true } },
        service: { select: { id: true, name: true, price: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/appointments/[id] error', err);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const apptId = Number(params.id);
    if (!Number.isFinite(apptId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await prisma.appointment.delete({ where: { id: apptId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/appointments/[id] error', err);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
