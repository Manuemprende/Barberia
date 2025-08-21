'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
// 👇 NUEVO
import LogoutButton from '@/components/LogoutButton';

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

type Dashboard = {
  today: { total: number; paid: number; unpaid: number };
  revenue: { day: number; week: number; month: number };
  payments: { unpaidCount: number; refundedCount: number; paidCount: number };
  upcoming24h: Appointment[];
  comments: {
    visibleCount: number;
    latest: Array<{ id: number; name: string; message: string; createdAt: string; visible?: boolean }>;
  };
  services: { total: number };
  barbers: { total: number };
};

type GalleryImage = {
  id: number;
  url: string;
  alt?: string | null;
  visible?: boolean;
  order?: number | null;
  createdAt: string;
};

const clp = (n: number) =>
  n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

const fmtDT = (iso: string) =>
  new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });

export default function AdminDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  // Citas de HOY (tabla con acciones)
  const [apts, setApts] = useState<Appointment[]>([]);
  const [loadingApts, setLoadingApts] = useState(true);

  // Estado de guardado para comentarios
  const [saving, setSaving] = useState<{ id: number; action: 'hide' | 'delete' } | null>(null);

  // --------- GALERÍA ----------
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [imgTitle, setImgTitle] = useState('');
  const [imgURL, setImgURL] = useState('');
  const [imgFile, setImgFile] = useState<File | null>(null);

  // --------- ALTA RÁPIDA: Servicios & Barberos ----------
  const [svcName, setSvcName] = useState('');
  const [svcPrice, setSvcPrice] = useState<number | ''>('');
  const [svcDuration, setSvcDuration] = useState<number | ''>('');
  const [barberName, setBarberName] = useState('');
  const [creatingSvc, setCreatingSvc] = useState(false);
  const [creatingBarber, setCreatingBarber] = useState(false);

  // ------- Load dashboard -------
  const loadDashboard = async () => {
    setLoading(true);
    try {
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

  // ------- Load citas HOY -------
  const loadTodayAppointments = async () => {
    setLoadingApts(true);
    try {
      const r = await fetch('/api/appointments?today=1&limit=100', { cache: 'no-store' });
      const arr = (await r.json().catch(() => [])) as Appointment[];
      setApts(Array.isArray(arr) ? arr : []);
    } finally {
      setLoadingApts(false);
    }
  };

  // ------- Load galería -------
  const loadGallery = async () => {
    setLoadingGallery(true);
    try {
      const r = await fetch('/api/gallery?limit=20', { cache: 'no-store' });
      const arr = (await r.json().catch(() => [])) as GalleryImage[];
      setGallery(Array.isArray(arr) ? arr : []);
    } finally {
      setLoadingGallery(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadTodayAppointments();
    loadGallery();
  }, []);

  // ------- Acciones comentarios -------
  const toggleVisibleComment = async (id: number, currentVisible = true) => {
    try {
      setSaving({ id, action: 'hide' });
      const r = await fetch(`/api/comments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: !currentVisible }),
      });
      if (!r.ok) throw new Error('patch_failed');
      setData(prev =>
        prev
          ? {
              ...prev,
              comments: {
                ...prev.comments,
                latest: prev.comments.latest.filter(c => c.id !== id),
                visibleCount: Math.max(0, prev.comments.visibleCount - 1),
              },
            }
          : prev
      );
    } catch {
      alert('No se pudo cambiar visibilidad.');
    } finally {
      setSaving(null);
    }
  };

  const removeComment = async (id: number) => {
    if (!confirm('¿Eliminar este comentario? Esta acción es permanente.')) return;
    try {
      setSaving({ id, action: 'delete' });
      const r = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('delete_failed');
      setData(prev =>
        prev
          ? {
              ...prev,
              comments: {
                ...prev.comments,
                latest: prev.comments.latest.filter(c => c.id !== id),
                visibleCount: Math.max(0, prev.comments.visibleCount - 1),
              },
            }
          : prev
      );
    } catch {
      alert('No se pudo eliminar.');
    } finally {
      setSaving(null);
    }
  };

  // ------- Acciones de citas -------
  const patchAppt = (id: number, body: any) =>
    fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  const updateRowLocal =
    (arrSetter: (fn: (prev: Appointment[]) => Appointment[]) => void) =>
    (id: number, patch: Partial<Appointment>) =>
      arrSetter(prev => prev.map(x => (x.id === id ? { ...x, ...patch } : x)));

  const updateRowToday = updateRowLocal(setApts);
  const updateRowUpcoming = (id: number, patch: Partial<Appointment>) => {
    setData(prev =>
      prev
        ? { ...prev, upcoming24h: prev.upcoming24h.map(a => (a.id === id ? { ...a, ...patch } : a)) }
        : prev
    );
  };

  const toggleConfirm = async (id: number, current: Appointment['status'], where: 'today' | 'upcoming') => {
    const next = current === 'CONFIRMED' ? 'SCHEDULED' : 'CONFIRMED';
    const r = await patchAppt(id, { status: next });
    if (!r.ok) return;
    (where === 'today' ? updateRowToday : updateRowUpcoming)(id, { status: next });
  };

  const toggleCancel = async (id: number, current: Appointment['status'], where: 'today' | 'upcoming') => {
    const next = current === 'CANCELLED' ? 'SCHEDULED' : 'CANCELLED';
    const r = await patchAppt(id, { status: next });
    if (!r.ok) return;
    (where === 'today' ? updateRowToday : updateRowUpcoming)(id, { status: next });
  };

  const markPaid = async (id: number, where: 'today' | 'upcoming') => {
    const r = await patchAppt(id, { paymentStatus: 'PAID' });
    if (!r.ok) return;
    (where === 'today' ? updateRowToday : updateRowUpcoming)(id, { paymentStatus: 'PAID' });
  };

  // ------- Alta rápida: Servicio -------
  const createService = async () => {
    if (!svcName.trim() || !svcPrice || !svcDuration) {
      alert('Completa nombre, precio y duración.');
      return;
    }
    setCreatingSvc(true);
    try {
      const r = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: svcName.trim(),
          price: Number(svcPrice),
          duration: Number(svcDuration),
        }),
      });
      if (!r.ok) throw new Error('svc_failed');
      setSvcName('');
      setSvcPrice('');
      setSvcDuration('');
      loadDashboard();
      alert('Servicio creado.');
    } catch {
      alert('No se pudo crear el servicio.');
    } finally {
      setCreatingSvc(false);
    }
  };

  // ------- Alta rápida: Barber -------
  const createBarber = async () => {
    if (!barberName.trim()) {
      alert('Ingresa el nombre del barbero.');
      return;
    }
    setCreatingBarber(true);
    try {
      const r = await fetch('/api/barbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: barberName.trim() }),
      });
      if (!r.ok) throw new Error('barber_failed');
      setBarberName('');
      loadDashboard();
      alert('Barbero creado.');
    } catch {
      alert('No se pudo crear el barbero.');
    } finally {
      setCreatingBarber(false);
    }
  };

  // ------- Galería: subir archivo o URL -------
  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setImgFile(f);
  };

  const uploadImage = async () => {
    if (!imgFile && !imgURL.trim()) {
      alert('Selecciona un archivo o pega una URL.');
      return;
    }
    setUploadBusy(true);
    try {
      let r: Response;
      if (imgFile) {
        const fd = new FormData();
        fd.append('file', imgFile);
        if (imgTitle.trim()) fd.append('title', imgTitle.trim());
        r = await fetch('/api/gallery', { method: 'POST', body: fd });
      } else {
        r = await fetch('/api/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: imgURL.trim(),
            title: imgTitle.trim() || undefined,
          }),
        });
      }
      if (!r.ok) throw new Error('upload_failed');
      setImgTitle('');
      setImgURL('');
      setImgFile(null);
      await loadGallery();
      alert('Imagen subida.');
    } catch {
      alert('No se pudo subir la imagen.');
    } finally {
      setUploadBusy(false);
    }
  };

  const toggleVisibleImage = async (id: number, curr = true) => {
    try {
      const r = await fetch(`/api/gallery/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: !curr }),
      });
      if (!r.ok) throw new Error('g_patch');
      setGallery(prev => prev.map(g => (g.id === id ? { ...g, visible: !curr } : g)));
    } catch {
      alert('No se pudo cambiar visibilidad de la imagen.');
    }
  };

  const deleteImage = async (id: number) => {
    if (!confirm('¿Eliminar esta imagen?')) return;
    try {
      const r = await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('g_del');
      setGallery(prev => prev.filter(g => g.id !== id));
    } catch {
      alert('No se pudo eliminar la imagen.');
    }
  };

  if (loading) return <p className="text-white p-6">Cargando métricas…</p>;
  if (!data) return <p className="text-red-400 p-6">Error al cargar métricas</p>;

  return (
    <div className="min-h-[80vh] text-white">
      {/* Header */}
      <header className="border-b border-yellow-600 bg-[#0e0e0e]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-yellow-500">Corte Maestro · Admin</h1>
          <nav className="flex items-center gap-5 text-sm">
            <Link href="/admin" className="text-yellow-400">Dashboard</Link>
            <Link href="/admin/citas" className="hover:text-yellow-400">Citas</Link>
            <Link href="/admin/servicios" className="hover:text-yellow-400">Servicios</Link>
            {/* 👇 REEMPLAZO: botón de logout con toast y redirect */}
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* 1) KPIs */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card k="Citas hoy" v={data.today.total} />
          <Card k="Ingresos hoy" v={clp(data.revenue.day)} />
          <Card k="Ingresos semana" v={clp(data.revenue.week)} />
          <Card k="Ingresos mes" v={clp(data.revenue.month)} />
        </section>

        {/* 2) Próximas 24 horas */}
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
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.upcoming24h.map((a) => {
                const phone = a.whatsapp?.replace(/\D+/g, '') || '';
                return (
                  <li key={a.id} className="rounded-lg border border-white/10 p-3 bg-[#0f0f0f] flex flex-col gap-2">
                    {/* Cabecera */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{a.customerName}</span>
                        {phone && (
                          <a
                            className="text-yellow-400 hover:text-yellow-300 underline"
                            href={`https://wa.me/${phone}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Abrir WhatsApp"
                          >
                            +{phone}
                          </a>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{fmtDT(a.start)}</span>
                    </div>

                    {/* Cuerpo */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div className="text-gray-300">
                        <div className="text-xs text-gray-500">Servicio</div>
                        <div>{a.service?.name ?? '—'}</div>
                      </div>
                      <div className="text-gray-300">
                        <div className="text-xs text-gray-500">Precio</div>
                        <div>{typeof a.service?.price === 'number' ? clp(a.service.price) : '—'}</div>
                      </div>
                      <div className="text-gray-300">
                        <div className="text-xs text-gray-500">Barbero</div>
                        <div>{a.barber?.name ?? '—'}</div>
                      </div>
                      <div className="flex items-center gap-2">
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
                      </div>
                    </div>

                    {/* Botonera */}
                    <div className="flex flex-wrap gap-2 mt-1">
                      {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
                        <button
                          onClick={() => toggleConfirm(a.id, a.status, 'upcoming')}
                          className="px-3 py-1 rounded bg-blue-700 hover:bg-blue-600 text-white text-xs sm:text-sm"
                          title={a.status === 'CONFIRMED' ? 'Volver a Agendada' : 'Confirmar'}
                        >
                          {a.status === 'CONFIRMED' ? 'Desconfirmar' : 'Confirmar'}
                        </button>
                      )}

                      <button
                        onClick={() => toggleCancel(a.id, a.status, 'upcoming')}
                        className="px-3 py-1 rounded bg-yellow-600 hover:bg-yellow-500 text-black text-xs sm:text-sm"
                        title={a.status === 'CANCELLED' ? 'Reactivar' : 'Anular'}
                      >
                        {a.status === 'CANCELLED' ? 'Reactivar' : 'Anular'}
                      </button>

                      {a.paymentStatus !== 'PAID' && (
                        <button
                          onClick={() => markPaid(a.id, 'upcoming')}
                          className="px-3 py-1 rounded bg-teal-700 hover:bg-teal-600 text-white text-xs sm:text-sm"
                        >
                          Pagado
                        </button>
                      )}

                      {phone && (
                        <a
                          className="px-3 py-1 rounded border border-yellow-600 text-yellow-400 text-xs sm:text-sm"
                          href={`https://wa.me/${phone}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* 3) Citas HOY */}
        <section className="bg-[#131313] border border-yellow-600 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Citas de hoy</h3>
            <button
              onClick={loadTodayAppointments}
              className="bg-yellow-600 hover:bg-yellow-500 text-black rounded px-3 py-1 text-sm"
            >
              Refrescar
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-[#1b1b1b] text-gray-300">
                <tr>
                  <th className="px-3 py-2 text-left">Cliente</th>
                  <th className="px-3 py-2 text-left hidden sm:table-cell">Whatsapp</th>
                  <th className="px-3 py-2 text-left hidden sm:table-cell">Servicio</th>
                  <th className="px-3 py-2 text-left hidden sm:table-cell">Precio</th>
                  <th className="px-3 py-2 text-left hidden sm:table-cell">Barbero</th>
                  <th className="px-3 py-2 text-left hidden sm:table-cell">Inicio</th>
                  <th className="px-3 py-2 text-left">Estado</th>
                  <th className="px-3 py-2 text-left">Pago</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {loadingApts ? (
                  <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-400">Cargando…</td></tr>
                ) : apts.length === 0 ? (
                  <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-400">Sin citas hoy.</td></tr>
                ) : (
                  apts.map(a => {
                    const phone = a.whatsapp?.replace(/\D+/g, '') || '';
                    return (
                      <tr key={a.id} className="bg-[#131313] align-top">
                        {/* Cliente + botones debajo en móvil */}
                        <td className="px-3 py-2 min-w-[260px]">
                          <div className="font-medium">{a.customerName}</div>

                          <div className="mt-2 grid grid-cols-2 gap-2 sm:auto-cols-max sm:grid-flow-col sm:justify-start">
                            {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
                              <button
                                onClick={() => toggleConfirm(a.id, a.status, 'today')}
                                className="px-3 py-1 rounded bg-blue-700 hover:bg-blue-600 text-white text-xs sm:text-sm w-full sm:w-auto"
                                title={a.status === 'CONFIRMED' ? 'Volver a Agendada' : 'Confirmar'}
                              >
                                {a.status === 'CONFIRMED' ? 'Desconfirmar' : 'Confirmar'}
                              </button>
                            )}

                            <button
                              onClick={() => toggleCancel(a.id, a.status, 'today')}
                              className="px-3 py-1 rounded bg-yellow-600 hover:bg-yellow-500 text-black text-xs sm:text-sm w-full sm:w-auto"
                              title={a.status === 'CANCELLED' ? 'Reactivar' : 'Anular'}
                            >
                              {a.status === 'CANCELLED' ? 'Reactivar' : 'Anular'}
                            </button>

                            {a.paymentStatus !== 'PAID' && (
                              <button
                                onClick={() => markPaid(a.id, 'today')}
                                className="px-3 py-1 rounded bg-teal-700 hover:bg-teal-600 text-white text-xs sm:text-sm w-full sm:w-auto"
                              >
                                Pagado
                              </button>
                            )}

                            {phone && (
                              <a
                                className="px-3 py-1 rounded border border-yellow-600 text-yellow-400 text-xs sm:text-sm text-center w-full sm:w-auto"
                                href={`https://wa.me/${phone}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                WhatsApp
                              </a>
                            )}
                          </div>
                        </td>

                        {/* columnas informativas: ocultas en móvil */}
                        <td className="px-3 py-2 hidden sm:table-cell">
                          {phone ? (
                            <a className="text-yellow-400 hover:text-yellow-300" href={`https://wa.me/${phone}`} target="_blank">
                              +{phone}
                            </a>
                          ) : '—'}
                        </td>
                        <td className="px-3 py-2 hidden sm:table-cell">{a.service?.name ?? '—'}</td>
                        <td className="px-3 py-2 hidden sm:table-cell">
                          {typeof a.service?.price === 'number' ? clp(a.service.price) : '—'}
                        </td>
                        <td className="px-3 py-2 hidden sm:table-cell">{a.barber?.name ?? '—'}</td>
                        <td className="px-3 py-2 hidden sm:table-cell">{fmtDT(a.start)}</td>

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
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4) Catálogo rápido */}
        <section className="bg-[#131313] border border-yellow-600 rounded-xl p-4">
          <h3 className="font-semibold mb-3">Catálogo rápido</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Nuevo Servicio */}
            <div className="rounded-lg border border-white/10 p-3 bg-[#0f0f0f]">
              <h4 className="font-medium mb-2">Nuevo servicio</h4>
              <div className="grid gap-2">
                <input
                  value={svcName}
                  onChange={e => setSvcName(e.target.value)}
                  placeholder="Nombre del servicio"
                  className="bg-[#131313] border border-yellow-600 rounded px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={svcPrice}
                    onChange={e => setSvcPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    type="number"
                    placeholder="Precio (CLP)"
                    className="bg-[#131313] border border-yellow-600 rounded px-3 py-2 text-sm"
                  />
                  <input
                    value={svcDuration}
                    onChange={e => setSvcDuration(e.target.value === '' ? '' : Number(e.target.value))}
                    type="number"
                    placeholder="Duración (min)"
                    className="bg-[#131313] border border-yellow-600 rounded px-3 py-2 text-sm"
                  />
                </div>
                <button
                  disabled={creatingSvc}
                  onClick={createService}
                  className="bg-yellow-600 hover:bg-yellow-500 text-black rounded px-3 py-2 text-sm disabled:opacity-60"
                >
                  {creatingSvc ? 'Creando…' : 'Crear servicio'}
                </button>
                <p className="text-xs text-gray-400">
                  Total servicios: <span className="text-yellow-400">{data.services.total}</span>
                </p>
              </div>
            </div>

            {/* Nuevo Barbero */}
            <div className="rounded-lg border border-white/10 p-3 bg-[#0f0f0f]">
              <h4 className="font-medium mb-2">Nuevo barbero</h4>
              <div className="grid gap-2">
                <input
                  value={barberName}
                  onChange={e => setBarberName(e.target.value)}
                  placeholder="Nombre del barbero"
                  className="bg-[#131313] border border-yellow-600 rounded px-3 py-2 text-sm"
                />
                <button
                  disabled={creatingBarber}
                  onClick={createBarber}
                  className="bg-yellow-600 hover:bg-yellow-500 text-black rounded px-3 py-2 text-sm disabled:opacity-60"
                >
                  {creatingBarber ? 'Creando…' : 'Crear barbero'}
                </button>
                <p className="text-xs text-gray-400">
                  Total barberos: <span className="text-yellow-400">{data.barbers.total}</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5) Galería */}
        <section className="bg-[#131313] border border-yellow-600 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Galería</h3>
            <button
              onClick={loadGallery}
              className="bg-yellow-600 hover:bg-yellow-500 text-black rounded px-3 py-1 text-sm"
            >
              Refrescar
            </button>
          </div>

          {/* Subida */}
          <div className="rounded-lg border border-white/10 p-3 bg-[#0f0f0f] mb-4">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                value={imgTitle}
                onChange={e => setImgTitle(e.target.value)}
                placeholder="Título (opcional)"
                className="bg-[#131313] border border-yellow-600 rounded px-3 py-2 text-sm"
              />
              <input
                type="file"
                accept="image/*"
                onChange={onSelectFile}
                className="text-sm"
                title="Seleccionar archivo"
              />
            </div>
            <div className="grid gap-2 mt-2 sm:grid-cols-[1fr_auto]">
              <input
                value={imgURL}
                onChange={e => setImgURL(e.target.value)}
                placeholder="O pega una URL de imagen…"
                className="bg-[#131313] border border-yellow-600 rounded px-3 py-2 text-sm"
              />
              <button
                disabled={uploadBusy}
                onClick={uploadImage}
                className="bg-yellow-600 hover:bg-yellow-500 text-black rounded px-3 py-2 text-sm disabled:opacity-60"
              >
                {uploadBusy ? 'Subiendo…' : 'Subir imagen'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Puedes subir un archivo o pegar una URL.
            </p>
          </div>

          {/* Grid de imágenes */}
          {loadingGallery ? (
            <p className="text-gray-400 text-sm">Cargando galería…</p>
          ) : gallery.length === 0 ? (
            <p className="text-gray-400 text-sm">Aún no hay imágenes.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-3">
              {gallery.map(img => (
                <li key={img.id} className="rounded-lg border border-white/10 bg-[#0f0f0f] overflow-hidden">
                  <div className="aspect-video bg-black/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt || 'Imagen'} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-medium truncate">{img.alt || 'Sin título'}</div>
                      <span
                        className={
                          'text-[10px] rounded px-1.5 py-0.5 ' +
                          (img.visible ? 'bg-emerald-900/40 text-emerald-300' : 'bg-gray-800 text-gray-300')
                        }
                      >
                        {img.visible ? 'visible' : 'oculta'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => toggleVisibleImage(img.id, img.visible ?? true)}
                        className="px-3 py-1 rounded bg-yellow-600 hover:bg-yellow-500 text-black text-xs"
                      >
                        {img.visible ? 'Ocultar' : 'Mostrar'}
                      </button>
                      <button
                        onClick={() => deleteImage(img.id)}
                        className="px-3 py-1 rounded bg-red-700 hover:bg-red-600 text-white text-xs"
                      >
                        Eliminar
                      </button>
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {new Date(img.createdAt).toLocaleString('es-CL')}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 6) Últimos comentarios */}
        <section className="bg-[#131313] border border-yellow-600 rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h3 className="font-semibold">Últimos comentarios visibles</h3>
            <span className="text-sm text-gray-400">Visibles: {data.comments.visibleCount}</span>
          </div>

          {data.comments.latest.length === 0 ? (
            <p className="text-gray-400 text-sm">No hay comentarios todavía.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.comments.latest.map((c) => (
                <li
                  key={c.id}
                  className="rounded-lg border border-white/10 p-3 bg-[#0f0f0f] flex flex-col gap-2"
                >
                  <p className="text-sm italic text-gray-200">“{c.message}”</p>
                  <div className="flex flex-wrap items-center gap-2 justify-between text-xs text-gray-400">
                    <span>{c.name}</span>
                    <span>{new Date(c.createdAt).toLocaleDateString('es-CL')}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-1">
                    <button
                      onClick={() => toggleVisibleComment(c.id, true)}
                      disabled={saving?.id === c.id && saving?.action === 'hide'}
                      className="px-3 py-1 rounded bg-yellow-600 hover:bg-yellow-500 text-black text-xs disabled:opacity-60"
                    >
                      {saving?.id === c.id && saving?.action === 'hide' ? 'Guardando…' : 'Ocultar'}
                    </button>
                    <button
                      onClick={() => removeComment(c.id)}
                      disabled={saving?.id === c.id && saving?.action === 'delete'}
                      className="px-3 py-1 rounded bg-red-700 hover:bg-red-600 text-white text-xs disabled:opacity-60"
                    >
                      {saving?.id === c.id && saving?.action === 'delete' ? 'Eliminando…' : 'Eliminar'}
                    </button>
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
