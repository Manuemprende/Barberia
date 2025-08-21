// src/app/api/appointments/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Status = 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

// Helpers de validación
const STATUS_VALUES: Status[] = ['SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
const PAY_STATUS_VALUES: PaymentStatus[] = ['UNPAID', 'PAID', 'REFUNDED'];

function isValidStatus(v: unknown): v is Status {
  return typeof v === 'string' && STATUS_VALUES.includes(v as Status);
}
function isValidPayStatus(v: unknown): v is PaymentStatus {
  return typeof v === 'string' && PAY_STATUS_VALUES.includes(v as PaymentStatus);
}

// Transiciones de status
function canTransitionStatus(from: Status, to: Status): boolean {
  if (from === to) return true;
  if (from === 'COMPLETED') return false;                         // COMPLETED es terminal
  if (to === 'COMPLETED' && from === 'CANCELLED') return false;   // no completar canceladas
  // Permitimos moverse entre SCHEDULED, CONFIRMED y CANCELLED
  return true;
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> } // Next 15: params es async
) {
  try {
    const { id } = await ctx.params;
    const apptId = Number(id);
    if (!Number.isFinite(apptId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const raw = (await req.json().catch(() => ({}))) as {
      status?: unknown;
      paymentStatus?: unknown;
      paidAt?: string | null;
    };

    // Normalizar y validar enums
    const body: {
      status?: Status;
      paymentStatus?: PaymentStatus;
      paidAt?: string | null;
    } = {};

    if (typeof raw.status !== 'undefined') {
      if (!isValidStatus(raw.status)) {
        return NextResponse.json({ error: 'status inválido' }, { status: 400 });
      }
      body.status = raw.status;
    }

    if (typeof raw.paymentStatus !== 'undefined') {
      if (!isValidPayStatus(raw.paymentStatus)) {
        return NextResponse.json({ error: 'paymentStatus inválido' }, { status: 400 });
      }
      body.paymentStatus = raw.paymentStatus;
    }

    body.paidAt = raw.paidAt ?? undefined;

    if (!body || (typeof body.status === 'undefined' && typeof body.paymentStatus === 'undefined')) {
      return NextResponse.json(
        { error: 'Nada para actualizar (status o paymentStatus requerido)' },
        { status: 400 }
      );
    }

    // Estado actual
    const current = await prisma.appointment.findUnique({
      where: { id: apptId },
      select: {
        status: true,
        paymentStatus: true,
        paidAt: true,
        priceSnapshot: true,
        serviceId: true,
      },
    });

    if (!current) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
    }

    // --- Reglas de pago ---
    if (typeof body.paymentStatus !== 'undefined') {
      // Una vez PAID, no se puede volver atrás
      if (current.paymentStatus === 'PAID' && body.paymentStatus !== 'PAID') {
        return NextResponse.json(
          { error: 'La cita ya está pagada y no puede volver atrás.' },
          { status: 400 }
        );
      }
      // Solo permitimos marcar como PAID desde no pagado (no manejamos REFUND aquí)
      if (current.paymentStatus !== 'PAID' && body.paymentStatus !== 'PAID') {
        return NextResponse.json(
          { error: 'Solo se permite marcar como pagada (no se admite revertir ni reembolsar por ahora).' },
          { status: 400 }
        );
      }
    }

    // --- Reglas de status ---
    if (typeof body.status !== 'undefined') {
      if (!canTransitionStatus(current.status as Status, body.status)) {
        return NextResponse.json(
          { error: `Transición de estado no permitida: ${current.status} → ${body.status}` },
          { status: 400 }
        );
      }
      // Si está pagada (ya) o quedará pagada tras este PATCH, no permitir volver a SCHEDULED
      const willBePaid = body.paymentStatus === 'PAID' || current.paymentStatus === 'PAID';
      if (willBePaid && body.status === 'SCHEDULED') {
        return NextResponse.json(
          { error: 'Una cita pagada no puede volver a SCHEDULED. Usa CONFIRMED o CANCELLED.' },
          { status: 400 }
        );
      }
    }

    // Armamos patch
    const data: Record<string, any> = {};

    if (typeof body.status !== 'undefined') {
      data.status = body.status;
    }

    // Al marcar PAID, setear paidAt y priceSnapshot si no está
    if (typeof body.paymentStatus !== 'undefined') {
      data.paymentStatus = body.paymentStatus;
      if (body.paymentStatus === 'PAID') {
        data.paidAt = body.paidAt ? new Date(body.paidAt) : new Date();
        // Si no tenemos priceSnapshot, lo tomamos del servicio vigente
        if (!current.priceSnapshot || current.priceSnapshot <= 0) {
          if (current.serviceId) {
            const svc = await prisma.service.findUnique({
              where: { id: current.serviceId },
              select: { price: true },
            });
            data.priceSnapshot = svc?.price ?? 0;
          } else {
            data.priceSnapshot = 0;
          }
        }
      }
      // Si algún día habilitas REFUNDED, decide si paidAt se conserva o se pone null.
    }

    const updated = await prisma.appointment.update({
      where: { id: apptId },
      data,
      include: {
        barber: true,
        service: true,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/appointments/[id] error', err);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const apptId = Number(id);
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
