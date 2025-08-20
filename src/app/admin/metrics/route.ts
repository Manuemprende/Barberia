import { NextResponse } from 'next/server';

/**
 * API de métricas para el dashboard del admin.
 * Para no depender aún de Prisma, contamos usando tus APIs existentes.
 * - /api/comments  (GET)  -> totalComentarios
 * - /api/services  (GET)  -> totalServicios
 * TODO: si luego expones /api/appointments (GET), añadimos próximas citas reales.
 */
export async function GET(req: Request) {
  try {
    // base URL (soporta local y producción)
    const origin = new URL(req.url).origin;

    const [commentsRes, servicesRes] = await Promise.all([
      fetch(`${origin}/api/comments`, { cache: 'no-store' }),
      fetch(`${origin}/api/services`, { cache: 'no-store' }),
    ]);

    const comments = (await commentsRes.json().catch(() => [])) as unknown[];
    const services = (await servicesRes.json().catch(() => [])) as unknown[];

    const totalComentarios = Array.isArray(comments) ? comments.length : 0;
    const totalServicios   = Array.isArray(services) ? services.length : 0;

    // Por ahora no tenemos /api/appointments (GET) público → devolvemos arreglo vacío
    const proximas: any[] = [];
    const totalHoy = 0; // cuando tengamos appointments GET filtramos por fecha de hoy

    return NextResponse.json({
      totalHoy,
      totalComentarios,
      totalServicios,
      proximas,
    });
  } catch (e) {
    console.error('METRICS ERROR', e);
    return NextResponse.json({ error: 'metrics_failed' }, { status: 500 });
  }
}
