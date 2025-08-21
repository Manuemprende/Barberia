// src/app/admin/comentarios/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Comment = {
  id: number;
  name: string;
  message: string;
  createdAt: string;
  visible: boolean;
};

const PAGE_SIZE = 10;

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

async function uploadToCloudinary(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: fd,
  });
  if (!res.ok) throw new Error('upload_failed');
  const json = await res.json();
  return json.secure_url as string;
}


export default function AdminComentariosPage() {
  const [items, setItems] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [onlyHidden, setOnlyHidden] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      // Traemos todos para poder moderar (usa ?all=1 en tu GET público)
      const r = await fetch('/api/comments?all=1', { cache: 'no-store' });
      const data = (await r.json().catch(() => [])) as Comment[];
      setItems(Array.isArray(data) ? data : []);
      setPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let arr = onlyHidden ? items.filter(c => !c.visible) : items;
    if (!term) return arr;
    return arr.filter(c =>
      [c.name, c.message].join(' ').toLowerCase().includes(term)
    );
  }, [items, q, onlyHidden]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const paged = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);

  const updateRow = (id: number, patch: Partial<Comment>) =>
    setItems(prev => prev.map(x => (x.id === id ? { ...x, ...patch } : x)));

  const toggleVisible = async (c: Comment) => {
    const next = !c.visible;
    const r = await fetch(`/api/comments/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visible: next }),
    });
    if (r.ok) updateRow(c.id, { visible: next });
    else alert('No se pudo actualizar visibilidad.');
  };

  const remove = async (c: Comment) => {
    if (!confirm('¿Eliminar este comentario? Esta acción es permanente.')) return;
    const r = await fetch(`/api/comments/${c.id}`, { method: 'DELETE' });
    if (r.ok) setItems(prev => prev.filter(x => x.id !== c.id));
    else alert('No se pudo eliminar.');
  };

  return (
    <div className="min-h-[80vh] text-white">
      {/* Header */}
      <header className="border-b border-yellow-600 bg-[#0e0e0e]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-yellow-500">Corte Maestro · Admin</h1>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/admin" className="hover:text-yellow-400">Dashboard</Link>
            <Link href="/admin/citas" className="hover:text-yellow-400">Citas</Link>
            <Link href="/admin/servicios" className="hover:text-yellow-400">Servicios</Link>
            <Link href="/admin/comentarios" className="text-yellow-400">Comentarios</Link>
            <form action="/api/auth/logout" method="POST" className="inline">
              <button className="text-red-300 hover:text-red-400">Salir</button>
            </form>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold mr-2">Comentarios</h2>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyHidden}
              onChange={(e) => { setOnlyHidden(e.target.checked); setPage(1); }}
            />
            Mostrar solo ocultos
          </label>

          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Buscar por nombre o contenido…"
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
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Comentario</th>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">Cargando…</td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">Sin resultados.</td></tr>
              ) : (
                paged.map((c) => (
                  <tr key={c.id} className="bg-[#131313] align-top">
                    <td className="px-3 py-2 font-medium">{c.name}</td>
                    <td className="px-3 py-2 whitespace-pre-wrap">{c.message}</td>
                    <td className="px-3 py-2">
                      {new Date(c.createdAt).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          'rounded px-2 py-0.5 text-xs ' +
                          (c.visible
                            ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40'
                            : 'bg-gray-800 text-gray-300 border border-gray-700/50')
                        }
                      >
                        {c.visible ? 'Visible' : 'Oculto'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => toggleVisible(c)}
                          className={
                            'px-3 py-1 rounded text-xs sm:text-sm ' +
                            (c.visible
                              ? 'bg-yellow-600 hover:bg-yellow-500 text-black'
                              : 'bg-blue-700 hover:bg-blue-600 text-white')
                          }
                          title={c.visible ? 'Ocultar' : 'Mostrar'}
                        >
                          {c.visible ? 'Ocultar' : 'Mostrar'}
                        </button>

                        <button
                          onClick={() => remove(c)}
                          className="px-3 py-1 rounded bg-red-700 hover:bg-red-600 text-white text-xs sm:text-sm"
                          title="Eliminar"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
      </main>
    </div>
  );
}
