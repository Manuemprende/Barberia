'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FaSignOutAlt, FaCut, FaCalendarAlt, FaImage, FaComments, FaCheckCircle, FaTrash, FaMoneyBill } from 'react-icons/fa'

type Barber = { id: number; name: string }
type Service = { id: number; name: string; price: number; duration: number }
type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
type Appointment = {
  id: number
  customerName: string
  whatsapp: string
  start: string
  end: string
  status: AppointmentStatus
  barber: Barber | null
  service: Service | null
}
type SummaryRow = { serviceId: number; name: string; count: number; total: number }
type SummaryPayload = { rows: SummaryRow[]; grandTotal: number }

function fmtCLP(n: number) {
  return n.toLocaleString('es-CL')
}
function todayYYYYMMDD() {
  const d = new Date()
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [date, setDate] = useState(todayYYYYMMDD())
  const [barberId, setBarberId] = useState<string>('')
  const [status, setStatus] = useState<'ALL' | AppointmentStatus>('ALL')

  const [barbers, setBarbers] = useState<Barber[]>([])
  const [rows, setRows] = useState<Appointment[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [summary, setSummary] = useState<SummaryPayload>({ rows: [], grandTotal: 0 })

  const fetchBarbers = useCallback(async () => {
    const r = await fetch('/api/barbers')
    const data = (await r.json().catch(() => [])) as Barber[]
    setBarbers(Array.isArray(data) ? data : [])
  }, [])

  const fetchAppointments = useCallback(async () => {
    const qs = new URLSearchParams()
    if (date) qs.set('date', date)
    if (barberId) qs.set('barberId', barberId)
    if (status && status !== 'ALL') qs.set('status', status)

    const r = await fetch(`/api/appointments?${qs.toString()}`)
    const data = (await r.json().catch(() => ({ data: [], total: 0 }))) as { data?: Appointment[]; total?: number } | Appointment[]
    // Soportar ambos formatos
    const list = Array.isArray(data) ? data : (data.data ?? [])
    setRows(list)
    setTotalRows(Array.isArray(data) ? list.length : data.total ?? list.length)
  }, [date, barberId, status])

  const fetchSummary = useCallback(async () => {
    if (!date) return
    const r = await fetch(`/api/appointments/summary?date=${date}`)
    const json = (await r.json().catch(() => ({ rows: [], grandTotal: 0 }))) as SummaryPayload
    setSummary(json)
  }, [date])

  useEffect(() => { fetchBarbers() }, [fetchBarbers])
  useEffect(() => { fetchAppointments(); fetchSummary() }, [fetchAppointments, fetchSummary])

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/admin/login')
    } catch {
      // noop
    }
  }, [router])

  const patchStatus = useCallback(async (id: number, newStatus: AppointmentStatus) => {
    setLoading(true)
    try {
      const r = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!r.ok) throw new Error('Error actualizando estado')
      await fetchAppointments()
      await fetchSummary()
    } catch {
      alert('No se pudo actualizar la cita')
    } finally {
      setLoading(false)
    }
  }, [fetchAppointments, fetchSummary])

  const removeAppointment = useCallback(async (id: number) => {
    if (!confirm('¿Eliminar la cita?')) return
    setLoading(true)
    try {
      const r = await fetch(`/api/appointments/${id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error('Error eliminando cita')
      await fetchAppointments()
      await fetchSummary()
    } catch {
      alert('No se pudo eliminar la cita')
    } finally {
      setLoading(false)
    }
  }, [fetchAppointments, fetchSummary])

  const headerActions = useMemo(() => (
    <div className="flex gap-2">
      <Link href="/admin/appointments" className="hidden sm:inline-flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-md border border-zinc-700 hover:border-yellow-500 transition">
        <FaCalendarAlt /> Citas
      </Link>
      <Link href="/admin/services" className="hidden sm:inline-flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-md border border-zinc-700 hover:border-yellow-500 transition">
        <FaCut /> Servicios
      </Link>
      <Link href="/admin/gallery" className="hidden sm:inline-flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-md border border-zinc-700 hover:border-yellow-500 transition">
        <FaImage /> Galería
      </Link>
      <Link href="/admin/comments" className="hidden sm:inline-flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-md border border-zinc-700 hover:border-yellow-500 transition">
        <FaComments /> Comentarios
      </Link>
      <button
        onClick={handleLogout}
        className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-md border border-zinc-700 hover:border-yellow-500 transition"
      >
        <FaSignOutAlt /> Salir
      </button>
    </div>
  ), [handleLogout])

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-yellow-500">Corte Maestro · Admin</h1>
          {headerActions}
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        {/* Filtros */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-zinc-400">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-zinc-800 px-3 py-2 rounded border border-zinc-700"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400">Barbero</label>
              <select
                value={barberId}
                onChange={e => setBarberId(e.target.value)}
                className="w-full bg-zinc-800 px-3 py-2 rounded border border-zinc-700"
              >
                <option value="">Todos</option>
                {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-zinc-400">Estado</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as 'ALL' | AppointmentStatus)}
                className="w-full bg-zinc-800 px-3 py-2 rounded border border-zinc-700"
              >
                <option value="ALL">Todos</option>
                <option value="SCHEDULED">Pendiente</option>
                <option value="CONFIRMED">Aceptada</option>
                <option value="COMPLETED">Pagada</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 font-semibold">Citas</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-950/50">
                <tr>
                  <th className="px-4 py-2 text-left">Hora</th>
                  <th className="px-4 py-2 text-left">Cliente</th>
                  <th className="px-4 py-2 text-left">WhatsApp</th>
                  <th className="px-4 py-2 text-left">Barbero</th>
                  <th className="px-4 py-2 text-left">Servicio</th>
                  <th className="px-4 py-2 text-left">Precio</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                  <th className="px-4 py-2 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const dt = new Date(r.start)
                  const hh = String(dt.getHours()).padStart(2, '0')
                  const mm = String(dt.getMinutes()).padStart(2, '0')
                  return (
                    <tr key={r.id} className="border-t border-zinc-800">
                      <td className="px-4 py-2">{hh}:{mm}</td>
                      <td className="px-4 py-2">{r.customerName}</td>
                      <td className="px-4 py-2">{r.whatsapp}</td>
                      <td className="px-4 py-2">{r.barber?.name ?? '-'}</td>
                      <td className="px-4 py-2">{r.service?.name ?? '-'}</td>
                      <td className="px-4 py-2">${fmtCLP(r.service?.price ?? 0)}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700">
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          {r.status === 'SCHEDULED' && (
                            <button
                              disabled={loading}
                              onClick={() => patchStatus(r.id, 'CONFIRMED')}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-800 border border-zinc-700 rounded hover:border-yellow-500"
                              title="Aceptar cita"
                            >
                              <FaCheckCircle /> Aceptar
                            </button>
                          )}
                          {(r.status === 'SCHEDULED' || r.status === 'CONFIRMED') && (
                            <button
                              disabled={loading}
                              onClick={() => patchStatus(r.id, 'COMPLETED')}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-green-700/30 border border-green-700 rounded hover:bg-green-700/40"
                              title="Marcar como pagada"
                            >
                              <FaMoneyBill /> Pagada
                            </button>
                          )}
                          <button
                            disabled={loading}
                            onClick={() => removeAppointment(r.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-red-700/30 border border-red-700 rounded hover:bg-red-700/40"
                            title="Eliminar"
                          >
                            <FaTrash /> Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {rows.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-zinc-400" colSpan={8}>
                      No hay citas con los filtros actuales
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumen */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 font-semibold">Resumen del día (solo pagadas)</div>
          <div className="p-4 space-y-3">
            {summary.rows.length === 0 && <div className="text-zinc-400">Aún no hay pagos registrados hoy.</div>}
            {summary.rows.map(r => (
              <div key={r.serviceId} className="flex items-center justify-between">
                <div>{r.name} <span className="text-zinc-400">× {r.count}</span></div>
                <div className="font-semibold">${fmtCLP(r.total)}</div>
              </div>
            ))}
            <div className="border-t border-zinc-800 pt-3 flex items-center justify-between">
              <div className="font-semibold">Total</div>
              <div className="text-yellow-500 font-bold text-lg">${fmtCLP(summary.grandTotal)}</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
