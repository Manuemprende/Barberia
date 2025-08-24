// src/app/api/appointments/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const runtime = 'nodejs';

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
  if (from === 'COMPLETED') return false;                 // COMPLETED es terminal
  if (to === 'COMPLETED' && from === 'CANCELLED') return false; // no completar canceladas
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

    // ---- normalización/validación ligera
    let nextStatus: Status | undefined = undefined;
    let nextPay: PaymentStatus | undefined = undefined;
    if (typeof raw.status !== 'undefined') {
      if (!isValidStatus(raw.status)) {
        return NextResponse.json({ error: 'status inválido' }, { status: 400 });
      }
      nextStatus = raw.status;
    }
    if (typeof raw.paymentStatus !== 'undefined') {
      if (!isValidPayStatus(raw.paymentStatus)) {
        return NextResponse.json({ error: 'paymentStatus inválido' }, { status: 400 });
      }
      nextPay = raw.paymentStatus;
    }

    if (typeof nextStatus === 'undefined' && typeof nextPay === 'undefined') {
      return NextResponse.json(
        { error: 'Nada para actualizar (status o paymentStatus requerido)' },
        { status: 400 }
      );
    }

    // ---- estado actual
    const current = await prisma.appointment.findUnique({
      where: { id: apptId },
      select: {
        id: true,
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

    // ---- reglas de transición de estado
    if (typeof nextStatus !== 'undefined') {
      if (!canTransitionStatus(current.status as Status, nextStatus)) {
        return NextResponse.json(
          { error: `Transición de estado no permitida: ${current.status} → ${nextStatus}` },
          { status: 400 }
        );
      }
    }

    // ---- armar patch
    const data: Record<string, any> = {};
    if (typeof nextStatus !== 'undefined') data.status = nextStatus;

    // Si el frontend pide explícitamente un paymentStatus, lo aplicamos
    if (typeof nextPay !== 'undefined') {
      data.paymentStatus = nextPay;

      if (nextPay === 'PAID') {
        data.paidAt = raw.paidAt ? new Date(raw.paidAt) : new Date();
        // asegurar priceSnapshot
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
      } else {
        // UNPAID o REFUNDED -> no cuenta como pagado
        data.paidAt = null;
      }
    }

    // --- reglas automáticas cuando solo cambian STATUS ---
    const willBeStatus = typeof nextStatus !== 'undefined' ? nextStatus : (current.status as Status);
    const willBePay = typeof nextPay !== 'undefined' ? nextPay : (current.paymentStatus as PaymentStatus);

    // 1) Si pasamos a CANCELLED y estaba PAID (o terminará PAID en este patch) -> REFUNDED
    if (willBeStatus === 'CANCELLED' && (current.paymentStatus === 'PAID' || willBePay === 'PAID')) {
      data.paymentStatus = 'REFUNDED';
      data.paidAt = null;
    }

    // 2) Si reactivamos una cancelada que estaba REFUNDED y no se envió paymentStatus explícito -> UNPAID
    if (
      current.status === 'CANCELLED' &&
      typeof nextStatus !== 'undefined' &&
      nextStatus !== 'CANCELLED' &&
      typeof nextPay === 'undefined' &&
      current.paymentStatus === 'REFUNDED'
    ) {
      data.paymentStatus = 'UNPAID';
      data.paidAt = null;
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
