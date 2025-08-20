// src/app/admin/page.tsx
import Link from 'next/link';
import { cookies, headers } from 'next/headers';
import { COOKIE_NAME, verifyAdminJWT } from '@/lib/adminAuth';

async function getMetrics() {
  // Construimos el origin para evitar "Failed to parse URL from /api/..."
  const h = await headers();
  const host = h.get('host') ?? 'localhost:3000';
  const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http';

  // Si definiste NEXT_PUBLIC_BASE_URL en prod, úsalo; si no, usa host de la request
  const origin =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || `${proto}://${host}`;

  const r = await fetch(`${origin}/api/admin/metrics`, { cache: 'no-store' });
  if (!r.ok) {
    return { totalHoy: 0, totalComentarios: 0, totalServicios: 0, proximas: [] as any[] };
  }
  return r.json();
}

export default async function AdminHome() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  let email = 'admin';
  if (token) {
    try {
      const payload = await verifyAdminJWT(token);
      if (typeof payload.email === 'string') email = payload.email;
    } catch {}
  }

  const { totalHoy, totalComentarios, totalServicios, proximas } = await getMetrics();

  return (
    <div className="min-h-[80vh] text-white">
      <header className="border-b border-yellow-600 bg-[#0e0e0e]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-yellow-500">Corte Maestro · Admin</h1>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/admin" className="hover:text-yellow-400">Dashboard</Link>
            <Link href="/admin/citas" className="hover:text-yellow-400">Citas</Link>
            <Link href="/admin/servicios" className="hover:text-yellow-400">Servicios</Link>
            <form action="/api/auth/logout" method="POST" className="inline">
              <button className="text-red-300 hover:text-red-400">Salir</button>
            </form>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h2 className="text-2xl font-bold">
            Bienvenido, <span className="text-yellow-400">{email}</span>
          </h2>
          <p className="text-gray-400">Este es tu panel como dueño. Aquí verás un resumen y accesos rápidos.</p>
        </div>

        {/* KPIs con datos reales de /api/admin/metrics */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card k="Citas hoy" v={totalHoy} />
          <Card k="Próximas 24h" v={proximas.length} />
          <Card k="Comentarios" v={totalComentarios} />
          <Card k="Servicios activos" v={totalServicios} />
        </section>

        {/* Próximas citas */}
        <section className="bg-[#131313] border border-yellow-600 rounded-xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Próximas citas</h3>
            <Link className="text-yellow-500 text-sm hover:text-yellow-400" href="/admin/citas">
              ver todas
            </Link>
          </div>

          {proximas.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {proximas.map((c: any) => (
                <li key={c.id} className="flex justify-between border-b border-white/10 pb-2">
                  <span>{new Date(c.start).toLocaleString('es-CL')}</span>
                  <span>Cliente #{c.id}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">Aún no hay citas próximas o no se expone /api/appointments (GET).</p>
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
