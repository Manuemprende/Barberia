'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FiXCircle, FiRotateCcw, FiDollarSign, FiSlash } from 'react-icons/fi';

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
  paidAt?: string | null;
  barber?: Barber | null;
  service?: Service | null;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });

// ------- UI helpers -------
function StatusBadge({ s }: { s: Appointment['status'] }) {
  const base =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border';
  if (s === 'CANCELLED')
    return <span className={`${base} border-red-700/50 bg-red-900/40 text-red-200`}>CANCELLED</span>;
  if (s === 'COMPLETED')
    return <span className={`${base} border-emerald-700/40 bg-emerald-900/30 text-emerald-200`}>COMPLETED</span>;
  if (s === 'CONFIRMED')
    return <span className={`${base} border-blue-700/40 bg-blue-900/30 text-blue-200`}>CONFIRMED</span>;
  return <span className={`${base} border-yellow-700/40 bg-yellow-900/30 text-yellow-200`}>SCHEDULED</span>;
}

function PaymentBadge({ p, paidAt }: { p: Appointment['paymentStatus']; paidAt?: string | null }) {
  const base =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border';
  if (p === 'PAID')
    return (
      <span
        className={`${base} border-emerald-700/40 bg-emerald-900/30 text-emerald-200`}
        title={paidAt ? `Pagada: ${fmt(paidAt)}` : undefined}
      >
        PAID
      </span>
    );
  if (p === 'REFUNDED')
    return <span className={`${base} border-blue-700/40 bg-blue-900/30 text-blue-200`}>REFUNDED</span>;
  return <span className={`${base} border-gray-600 bg-gray-800 text-gray-300`}>UNPAID</span>;
}

export default function AdminCitasPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'ALL' | Appointment['status']>('ALL');
  const [range, setRange] = useState<'today' | 'upcoming' | 'all'>('upcoming');
  const [busyId, setBusyId] = useState<number | null>(null);

  const query = useMemo(() => {
    const qs = new URLSearchParams();
    if (range === 'today') qs.set('today', '1');
    if (range === 'upcoming') qs.set('upcoming', '1');
    if (status !== 'ALL') qs.set('status', status);
    qs.set('limit', '100');
    return `/api/appointments?${qs.toString()}`;
  }, [status, range]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(query, { cache: 'no-store' });
      const data = (await r.json().catch(() => [])) as Appointment[];
      setItems(Array.isArray(data) ? data : []);
      // fallback: si no hay "hoy" cambiamos a "próximas"
      if (range === 'today' && Array.isArray(data) && data.length === 0) {
        setRange('upcoming');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const toggleCancel = async (id: number, current: Appointment['status']) => {
    setBusyId(id);
    try {
      const next = current === 'CANCELLED' ? 'SCHEDULED' : 'CANCELLED';
      const r = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (!r.ok) throw new Error();
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: next } : x)));
    } catch {
      alert('No se pudo actualizar la cita.');
    } finally {
      setBusyId(null);
    }
  };

  const togglePaid = async (id: number, current: Appointment['paymentStatus']) => {
    setBusyId(id);
    try {
      const body = current === 'PAID' ? { unsetPaid: true } : { setPaidNow: true };
      const r = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error();
      setItems((prev) =>
        prev.map((x) =>
          x.id === id
            ? {
                ...x,
                paymentStatus: body.unsetPaid ? 'UNPAID' : 'PAID',
                paidAt: body.unsetPaid ? null : new Date().toISOString(),
              }
            : x
        )
      );
    } catch {
      alert('No se pudo actualizar el pago.');
    } finally {
      setBusyId(null);
    }
  };

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
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold mr-2">Citas</h2>

          {/* Rango rápido */}
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

          {/* Filtro estado */}
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

          <button
            onClick={load}
            className="ml-auto bg-yellow-600 hover:bg-yellow-500 text-black rounded px-3 py-1.5 text-sm"
          >
            Refrescar
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-yellow-600">
          <table className="min-w-full text-sm">
            <thead className="bg-[#1b1b1b] text-gray-300">
              <tr>
                <th className="px-3 py-2 text-left">Cliente</th>
                <th className="px-3 py-2 text-left">WhatsApp</th>
                <th className="px-3 py-2 text-left">Servicio</th>
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
                <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400">Cargando…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-400">Sin resultados.</td></tr>
              ) : (
                items.map((a) => (
                  <tr key={a.id} className="bg-[#131313]">
                    <td className="px-3 py-2">{a.customerName}</td>
                    <td className="px-3 py-2">
                      <a
                        className="text-yellow-400 hover:text-yellow-300"
                        href={`https://wa.me/${a.whatsapp.replace(/\D+/g, '')}`}
                        target="_blank"
                      >
                        {a.whatsapp}
                      </a>
                    </td>
                    <td className="px-3 py-2">{a.service?.name ?? '—'}</td>
                    <td className="px-3 py-2">{a.barber?.name ?? '—'}</td>
                    <td className="px-3 py-2">{fmt(a.start)}</td>
                    <td className="px-3 py-2">{fmt(a.end)}</td>
                    <td className="px-3 py-2"><StatusBadge s={a.status} /></td>
                    <td className="px-3 py-2"><PaymentBadge p={a.paymentStatus} paidAt={a.paidAt} /></td>
                    <td className="px-3 py-2">
                      <div className="inline-flex items-center gap-2">
                        {/* Cancelar/Reactivar */}
                        <button
                          onClick={() => toggleCancel(a.id, a.status)}
                          disabled={busyId === a.id}
                          className={
                            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ' +
                            'border transition-colors ' +
                            (a.status === 'CANCELLED'
                              ? 'bg-yellow-900/30 border-yellow-700/40 text-yellow-200 hover:bg-yellow-900/50'
                              : 'bg-red-900/30 border-red-700/40 text-red-200 hover:bg-red-900/50') +
                            (busyId === a.id ? ' opacity-60 cursor-not-allowed' : '')
                          }
                          title={a.status === 'CANCELLED' ? 'Reactivar' : 'Cancelar'}
                        >
                          {busyId === a.id ? (
                            <span>...</span>
                          ) : a.status === 'CANCELLED' ? (
                            <>
                              <FiRotateCcw className="text-yellow-300" />
                              Reactivar
                            </>
                          ) : (
                            <>
                              <FiXCircle className="text-red-300" />
                              Cancelar
                            </>
                          )}
                        </button>

                        {/* Pagada / Desmarcar */}
                        <button
                          onClick={() => togglePaid(a.id, a.paymentStatus)}
                          disabled={busyId === a.id || a.status === 'CANCELLED'}
                          className={
                            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ' +
                            'border transition-colors ' +
                            (a.paymentStatus === 'PAID'
                              ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700'
                              : 'bg-emerald-900/30 border-emerald-700/40 text-emerald-200 hover:bg-emerald-900/50') +
                            (busyId === a.id || a.status === 'CANCELLED' ? ' opacity-60 cursor-not-allowed' : '')
                          }
                          title={a.paymentStatus === 'PAID' ? 'Marcar NO pagada' : 'Marcar pagada'}
                        >
                          {busyId === a.id ? (
                            <span>...</span>
                          ) : a.paymentStatus === 'PAID' ? (
                            <>
                              <FiSlash className="text-gray-300" />
                              Desmarcar
                            </>
                          ) : (
                            <>
                              <FiDollarSign className="text-emerald-300" />
                              Pagada
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
