'use client';

import { useEffect, useState } from 'react';
import { SERVICE_ICONS, hashServiceKey } from '@/utils/serviceIcons';

type Service = {
  id: number;
  name: string;
  price: number;
  duration: number;
};

type Props = {
  services?: Service[];     // si ya los tienes, pásalos por props y no hace fetch
  title?: string;
  subtitle?: string;
};

export default function ServicesList({
  services: initial,
  title = 'Nuestros Servicios',
  subtitle = 'Profesionalismo, precisión y estilo en cada corte.'
}: Props) {
  const [services, setServices] = useState<Service[] | null>(initial ?? null);
  const [loading, setLoading] = useState(!initial);

  useEffect(() => {
    if (initial) return;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch('/api/services', { cache: 'no-store' });
        const data = (await r.json().catch(() => [])) as Service[];
        setServices(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, [initial]);

  return (
    <section className="w-full py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-yellow-500">{title}</h2>
          <p className="mt-2 text-gray-400">{subtitle}</p>
        </div>

        {loading ? (
          <p className="text-gray-400 text-center">Cargando servicios…</p>
        ) : !services || services.length === 0 ? (
          <p className="text-gray-400 text-center">Aún no hay servicios.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* ===== Asignación de íconos sin repetición en este render ===== */}
            {(() => {
              const used = new Set<number>();
              const pool = SERVICE_ICONS;
              const N = pool.length;

              return services.map((svc) => {
                // índice base determinístico por id+name
                let idx = hashServiceKey(svc.id, svc.name) % N;
                // evita repetidos rotando circularmente
                while (used.has(idx)) idx = (idx + 1) % N;
                used.add(idx);

                const Icon = pool[idx];

                return (
                  <li
                    key={svc.id}
                    className="rounded-2xl bg-[#121212] border border-yellow-600/40 p-6 text-center hover:border-yellow-500/60 transition"
                  >
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-600/40">
                      <Icon className="h-6 w-6 text-yellow-500" />
                    </div>

                    <h4 className="font-semibold text-white">{svc.name}</h4>

                    <div className="mt-2 text-sm text-gray-400 flex items-center justify-center gap-3">
                      <span>⏱ {svc.duration} min</span>
                      <span>•</span>
                      <span>
                        ${svc.price.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </li>
                );
              });
            })()}
            {/* ============================================================ */}
          </ul>
        )}
      </div>
    </section>
  );
}
