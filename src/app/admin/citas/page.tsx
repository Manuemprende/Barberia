'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Barber = { id: number; name: string };
type Service = { id: number; name: string; price: number };
type Appointment = {
  id: number;
  customerName: string;
  whatsapp: string;
  start: string; // ISO
  end: string;   // ISO
  status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  barber?: Barber | null;
  service?: Service | null;
};

const fmtDT = (iso: string) =>
  new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });

const clp = (n: number | undefined) =>
  typeof n === 'number'
    ? n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
    : '—';

const PAGE_SIZE = 10;

/* WhatsApp con mensaje prellenado */
const waReminderLink = (a: Appointment) => {
  const phone = a.whatsapp?.replace(/\D+/g, '');
  if (!phone) return '#';

  const fecha = fmtDT(a.start);
  const servicio = a.service?.name ?? 'tu servicio';
  const barbero  = a.barber?.name ? ` con ${a.barber?.name}` : '';
  const texto = `Hola ${a.customerName}, te recordamos tu cita en *Corte Maestro* para *${servicio}*${barbero} el *${fecha}*.
Por favor confirma tu asistencia respondiendo este mensaje. ¡Te esperamos! 💈✂️`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(texto)}`;
};

export default function AdminCitasPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'ALL' | Appointment['status']>('ALL');
  const [range, setRange] = useState<'today' | 'upcoming' | 'all'>('today');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const query = useMemo(() => {
    const qs = new URLSearchParams();
    if (range === 'today') qs.set('today', '1');
    if (range === 'upcoming') qs.set('upcoming', '1');
    if (status !== 'ALL') qs.set('status', status);
    qs.set('limit', '200'); // traemos más y paginamos en cliente
    return `/api/appointments?${qs.toString()}`;
  }, [status, range]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(query, { cache: 'no-store' });
      const data = (await r.json().catch(() => [])) as Appointment[];
      setItems(Array.isArray(data) ? data : []);
      setPage(1); // reset al cambiar filtros
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const updateRow = (id: number, patch: Partial<Appointment>) =>
    setItems(prev => prev.map(x => (x.id === id ? { ...x, ...patch } : x)));

  // ---- Acciones necesarias ----
  const patch = (id: number, body: any) =>
    fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  const confirm = async (id: number) => {
    const r = await patch(id, { status: 'CONFIRMED' });
    if (r.ok) updateRow(id, { status: 'CONFIRMED' });
    else alert('No se pudo confirmar la cita.');
  };

  const cancel = async (id: number) => {
    const r = await patch(id, { status: 'CANCELLED' });
    if (r.ok) updateRow(id, { status: 'CANCELLED' });
    else alert('No se pudo anular la cita.');
  };

  const markPaid = async (id: number) => {
    const r = await patch(id, { paymentStatus: 'PAID', paidAt: new Date().toISOString() });
    if (r.ok) updateRow(id, { paymentStatus: 'PAID' });
    else alert('No se pudo marcar como pagada.');
  };

  // ---- Búsqueda + paginación en cliente ----
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(a => {
      const pool = [
        a.customerName,
        a.whatsapp,
        a.service?.name ?? '',
        a.barber?.name ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return pool.includes(term);
    });
  }, [items, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  return (
    <div className="min-h-[80vh] text-white">
      {/* Header compacto con navegación */}
      <header className="border-b border-yellow-600 bg-[#0e0e0e]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-yellow-500">Corte Maestro · Admin</h1>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/admin" className="hover:text-yellow-400">Dashboard</Link>
            <Link href="/admin/citas" className="text-yellow-400">Citas</Link>
            <Link href="/admin/servicios" className="hover:text-yellow-400">Servicios</Link>
            <form action="/api/auth/logout" method="POST" className="inline">
              <button className="text-red-300 hover:text-red-400">Salir</button>
            </form>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Filtros + búsqueda */}
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold mr-2">Citas</h2>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Rango:</label>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as any)}
              className="bg-[#131313] border border-yellow-600 rounded px-2 py-1 text-sm"
            >
              <option value="today">Hoy</option>
              <option value="upcoming">Próximas</option>
              <option value="all">Todas</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Estado:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="bg-[#131313] border border-yellow-600 rounded px-2 py-1 text-sm"
            >
              <option value="ALL">Todos</option>
              <option value="SCHEDULED">Agendadas</option>
              <option value="CONFIRMED">Confirmadas</option>
              <option value="COMPLETED">Completadas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
          </div>

          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Buscar: cliente, WhatsApp, servicio, barbero…"
            className="min-w-[240px] flex-1 bg-[#131313] border border-yellow-600 rounded px-3 py-1 text-sm"
          />

          <button
            onClick={load}
            className="ml-auto bg-yellow-600 hover:bg-yellow-500 text-black rounded px-3 py-1 text-sm"
          >
            Refrescar
          </button>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto rounded-xl border border-yellow-600">
          <table className="min-w-full text-sm">
            <thead className="bg-[#1b1b1b] text-gray-300">
              <tr>
                <th className="px-3 py-2 text-left">Cliente</th>
                <th className="px-3 py-2 text-left">WhatsApp</th>
                <th className="px-3 py-2 text-left">Servicio</th>
                <th className="px-3 py-2 text-left">Precio</th>
                <th className="px-3 py-2 text-left">Barbero</th>
                <th className="px-3 py-2 text-left">Inicio</th>
                <th className="px-3 py-2 text-left">Fin</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2 text-left">Pago</th>
                <th className="px-3 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr><td colSpan={10} className="px-3 py-6 text-center text-gray-400">Cargando…</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={10} className="px-3 py-6 text-center text-gray-400">Sin resultados.</td></tr>
              ) : (
                paged.map((a) => {
                  const phone = a.whatsapp?.replace(/\D+/g, '') || '';
                  return (
                    <tr key={a.id} className="bg-[#131313] align-middle">
                      <td className="px-3 py-2">{a.customerName}</td>
                      <td className="px-3 py-2">
                        {phone ? (
                          <a className="text-yellow-400 hover:text-yellow-300" href={`https://wa.me/${phone}`} target="_blank">
                            +{phone}
                          </a>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-2">{a.service?.name ?? '—'}</td>
                      <td className="px-3 py-2">{clp(a.service?.price)}</td>
                      <td className="px-3 py-2">{a.barber?.name ?? '—'}</td>
                      <td className="px-3 py-2">{fmtDT(a.start)}</td>
                      <td className="px-3 py-2">{fmtDT(a.end)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            'rounded px-2 py-0.5 text-xs ' +
                            (a.status === 'CANCELLED'
                              ? 'bg-red-900/50 text-red-300 border border-red-700/50'
                              : a.status === 'COMPLETED'
                              ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40'
                              : a.status === 'CONFIRMED'
                              ? 'bg-blue-900/40 text-blue-300 border border-blue-700/40'
                              : 'bg-yellow-900/40 text-yellow-200 border border-yellow-700/40')
                          }
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            'rounded px-2 py-0.5 text-xs ' +
                            (a.paymentStatus === 'PAID'
                              ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40'
                              : a.paymentStatus === 'REFUNDED'
                              ? 'bg-purple-900/40 text-purple-300 border border-purple-700/40'
                              : 'bg-gray-800 text-gray-300 border border-gray-700/50')
                          }
                        >
                          {a.paymentStatus}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {/* Solo estos 4 botones, responsive y ordenados */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => confirm(a.id)}
                            disabled={a.status === 'CONFIRMED' || a.status === 'CANCELLED'}
                            className="px-3 py-1 rounded bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white text-xs sm:text-sm"
                            title="Confirmar"
                          >
                            Confirmar
                          </button>

                          <button
                            onClick={() => cancel(a.id)}
                            disabled={a.status === 'CANCELLED'}
                            className="px-3 py-1 rounded bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-black text-xs sm:text-sm"
                            title="Anular (Cancelar)"
                          >
                            Anular
                          </button>

                          <button
                            onClick={() => markPaid(a.id)}
                            disabled={a.paymentStatus === 'PAID'}
                            className="px-3 py-1 rounded bg-teal-700 hover:bg-teal-600 disabled:opacity-40 text-white text-xs sm:text-sm"
                            title="Marcar como pagado"
                          >
                            Pagado
                          </button>

                          <a
                            href={waReminderLink(a)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1 rounded bg-green-700 hover:bg-green-600 text-white text-xs sm:text-sm"
                            title="Enviar recordatorio por WhatsApp"
                          >
                            WhatsApp
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={pageSafe === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-3 py-1 rounded border border-yellow-600 text-yellow-400 disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-sm text-gray-400">
            Página {pageSafe} / {totalPages} · {filtered.length} resultados
          </span>
          <button
            disabled={pageSafe >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="px-3 py-1 rounded border border-yellow-600 text-yellow-400 disabled:opacity-40"
          >
            Siguiente →
          </button>
        </div>

        {/* Ayuda sobre pop-ups */}
        <p className="text-xs text-gray-400 text-center">
          Si el navegador bloquea las pestañas de WhatsApp, habilita los pop-ups para tu dominio del admin.
        </p>
      </main>
    </div>
  );
}
