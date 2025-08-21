'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Dashboard = {
  today: { total: number; paid: number; unpaid: number };
  revenue: { day: number; week: number; month: number };
  payments: { unpaidCount: number; refundedCount: number; paidCount: number };
  upcoming24h: Array<{
    id: number;
    customerName: string;
    whatsapp: string;
    start: string;
    end: string;
    status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
    paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
    barber?: { id: number; name: string } | null;
    service?: { id: number; name: string; price: number } | null;
  }>;
  comments: { visibleCount: number; latest: Array<{ id: number; name: string; message: string; createdAt: string }> };
  services: { total: number };
  barbers: { total: number };
};

const clp = (n: number) =>
  n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

const fmtDT = (iso: string) =>
  new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });

export default function AdminDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Si migraste a /api/admin/metrics, puedes cambiar esta URL.
        const r = await fetch('/api/admin/dashboard', { cache: 'no-store' });
        if (!r.ok) throw new Error('dash_err');
        const d = (await r.json()) as Dashboard;
        setData(d);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <p className="text-white p-6">Cargando métricas…</p>;
  if (!data) return <p className="text-red-400 p-6">Error al cargar métricas</p>;

  return (
    <div className="min-h-[80vh] text-white">
      {/* Header con navegación mínima */}
      <header className="border-b border-yellow-600 bg-[#0e0e0e]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-yellow-500">Corte Maestro · Admin</h1>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/admin" className="text-yellow-400">Dashboard</Link>
            <Link href="/admin/citas" className="hover:text-yellow-400">Citas</Link>
            <Link href="/admin/servicios" className="hover:text-yellow-400">Servicios</Link>
            <form action="/api/auth/logout" method="POST" className="inline">
              <button className="text-red-300 hover:text-red-400">Salir</button>
            </form>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* KPIs principales */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card k="Citas hoy" v={data.today.total} />
          <Card k="Ingresos hoy" v={clp(data.revenue.day)} />
          <Card k="Ingresos semana" v={clp(data.revenue.week)} />
          <Card k="Ingresos mes" v={clp(data.revenue.month)} />
        </section>

        {/* Estado de pagos + recursos */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card k="Citas pagadas" v={data.payments.paidCount} />
          <Card k="Citas impagas" v={data.payments.unpaidCount} />
          <Card k="Reembolsadas" v={data.payments.refundedCount} />
          <Card k="Servicios / Barberos" v={`${data.services.total} / ${data.barbers.total}`} />
        </section>

        {/* Próximas 24h */}
        <section className="bg-[#131313] border border-yellow-600 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Próximas 24 horas</h3>
            <Link className="text-yellow-500 text-sm hover:text-yellow-400" href="/admin/citas">
              ver todas
            </Link>
          </div>

          {data.upcoming24h.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay citas próximas.</p>
          ) : (
            <ul className="divide-y divide-white/10 text-sm">
              {data.upcoming24h.map((a) => {
                const phoneDigits = a.whatsapp?.replace(/\D+/g, '') || '';
                return (
                  <li
                    key={a.id}
                    className="
                      py-3 gap-3
                      flex flex-col md:grid
                      md:grid-cols-[150px_minmax(150px,1fr)_140px_1fr_110px_auto]
                      md:items-center
                    "
                  >
                    {/* Fecha/Hora */}
                    <span className="text-gray-300">{fmtDT(a.start)}</span>

                    {/* Cliente + WhatsApp */}
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{a.customerName}</span>
                      {phoneDigits && (
                        <a
                          className="text-yellow-400 hover:text-yellow-300 underline"
                          href={`https://wa.me/${phoneDigits}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Abrir WhatsApp"
                        >
                          {`+${phoneDigits}`}
                        </a>
                      )}
                    </div>

                    {/* Barbero */}
                    <span className="text-gray-300">{a.barber?.name ?? '—'}</span>

                    {/* Servicio + Precio */}
                    <div className="flex items-center justify-between md:justify-start md:gap-3">
                      <span className="text-gray-300">{a.service?.name ?? '—'}</span>
                      {typeof a.service?.price === 'number' && (
                        <span className="text-yellow-400 font-semibold">{clp(a.service.price)}</span>
                      )}
                    </div>

                    {/* Estado */}
                    <span
                      className={
                        'justify-self-start rounded px-2 py-0.5 text-xs ' +
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

                    {/* Pago */}
                    <span
                      className={
                        'justify-self-start rounded px-2 py-0.5 text-xs ' +
                        (a.paymentStatus === 'PAID'
                          ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40'
                          : a.paymentStatus === 'REFUNDED'
                          ? 'bg-purple-900/40 text-purple-300 border border-purple-700/40'
                          : 'bg-gray-800 text-gray-300 border border-gray-700/50')
                      }
                    >
                      {a.paymentStatus}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Últimos comentarios */}
        <section className="bg-[#131313] border border-yellow-600 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Últimos comentarios visibles</h3>
            <span className="text-sm text-gray-400">
              Total visibles: {data.comments.visibleCount}
            </span>
          </div>
          {data.comments.latest.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay comentarios todavía.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.comments.latest.map((c) => (
                <li key={c.id} className="rounded-lg border border-white/10 p-3 bg-[#0f0f0f]">
                  <p className="text-sm italic text-gray-200 mb-2">“{c.message}”</p>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{c.name}</span>
                    <span>{new Date(c.createdAt).toLocaleDateString('es-CL')}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function Card({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="rounded-xl border border-yellow-600 bg-[#131313] p-4">
      <p className="text-gray-400 text-sm">{k}</p>
      <p className="text-3xl font-bold">{v}</p>
    </div>
  );
}
