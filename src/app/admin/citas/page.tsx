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
  barber?: Barber | null;
  service?: Service | null;
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });

export default function AdminCitasPage() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'ALL' | Appointment['status']>('ALL');
  const [range, setRange] = useState<'today' | 'upcoming' | 'all'>('today');

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const toggleCancel = async (id: number, current: Appointment['status']) => {
    const next = current === 'CANCELLED' ? 'SCHEDULED' : 'CANCELLED';
    const r = await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    if (r.ok) {
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: next } : x)));
    } else {
      alert('No se pudo actualizar la cita.');
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
            className="ml-auto bg-yellow-600 hover:bg-yellow-500 text-black rounded px-3 py-1 text-sm"
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
                <th className="px-3 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-400">Cargando…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-400">Sin resultados.</td></tr>
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
                    <td className="px-3 py-2 space-x-2">
                      <button
                        onClick={() => toggleCancel(a.id, a.status)}
                        className="bg-yellow-600 hover:bg-yellow-500 text-black rounded px-2 py-1"
                        title={a.status === 'CANCELLED' ? 'Reactivar' : 'Cancelar'}
                      >
                        {a.status === 'CANCELLED' ? 'Reactivar' : 'Cancelar'}
                      </button>

                      {/* Placeholder para pago: lo activamos en la siguiente iteración */}
                      <button
                        disabled
                        className="bg-gray-700 text-gray-400 rounded px-2 py-1 cursor-not-allowed"
                        title="Marcar pagada (pendiente de activar)"
                      >
                        Pagada
                      </button>
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
