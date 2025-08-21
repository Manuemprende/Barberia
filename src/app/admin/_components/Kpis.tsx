'use client';

import { useEffect, useState } from 'react';

type Metrics = {
  today: { total: number; paid: number; unpaid: number };
  revenue: { day: number; week: number; month: number };
  services: { total: number };
  barbers: { total: number };
};

const CLP = (n: number) =>
  n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

type CardProps = { title: string; value: string | number; sub?: string };

function KpiCard({ title, value, sub }: CardProps) {
  return (
    <div className="rounded-xl border border-yellow-600 bg-[#131313] p-4">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-3xl font-bold leading-tight">{value}</p>
      {sub ? <p className="text-xs text-gray-400 mt-1">{sub}</p> : null}
    </div>
  );
}

export default function Kpis() {
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ok = true;
    (async () => {
      try {
        const r = await fetch('/api/admin/metrics', { cache: 'no-store' });
        const j = (await r.json().catch(() => null)) as Metrics | null;
        if (ok) setData(j);
      } finally {
        if (ok) setLoading(false);
      }
    })();
    return () => { ok = false; };
  }, []);

  if (loading) return <p className="text-gray-300">Cargando métricas…</p>;
  if (!data)   return <p className="text-red-400">Error al cargar métricas</p>;

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard title="Ingresos hoy"    value={CLP(data.revenue.day)} />
      <KpiCard title="Ingresos semana" value={CLP(data.revenue.week)} />
      <KpiCard title="Ingresos mes"    value={CLP(data.revenue.month)} />
      <KpiCard title="Servicios / Barberos" value={`${data.services.total} / ${data.barbers.total}`} />
    </section>
  );
}
