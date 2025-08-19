// src/components/AppointmentForm.tsx
'use client'

import { useState } from 'react'

export default function AppointmentForm() {
  const [customerName, setCustomerName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [barberId, setBarberId] = useState<number | null>(null)
  const [serviceId, setServiceId] = useState<number | null>(null)
  const [start, setStart] = useState('')
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          whatsapp,
          barberId,
          serviceId,
          start, // formato ISO (ej: "2025-08-06T14:00:00")
          notes
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al crear la cita')
      } else {
        setSuccess(true)
        // Opcional: resetear campos
        setCustomerName('')
        setWhatsapp('')
        setBarberId(null)
        setServiceId(null)
        setStart('')
        setNotes('')
      }
    } catch (unknown) {
      setError('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-zinc-900 p-6 rounded-xl">
      <input
        type="text"
        placeholder="Nombre del cliente"
        value={customerName}
        onChange={(e) => setCustomerName(e.target.value)}
        required
        className="w-full px-4 py-2 rounded bg-zinc-800 text-white"
      />
      <input
        type="text"
        placeholder="WhatsApp"
        value={whatsapp}
        onChange={(e) => setWhatsapp(e.target.value)}
        required
        className="w-full px-4 py-2 rounded bg-zinc-800 text-white"
      />
      <select
        value={barberId ?? ''}
        onChange={(e) => setBarberId(Number(e.target.value))}
        required
        className="w-full px-4 py-2 rounded bg-zinc-800 text-white"
      >
        <option value="">Selecciona un barbero</option>
        <option value="1">Juan Cortes</option>
        <option value="2">Pedro Estilo</option>
      </select>
      <select
        value={serviceId ?? ''}
        onChange={(e) => setServiceId(Number(e.target.value))}
        required
        className="w-full px-4 py-2 rounded bg-zinc-800 text-white"
      >
        <option value="">Selecciona un servicio</option>
        <option value="1">Corte Clásico</option>
        <option value="2">Afeitado Premium</option>
        <option value="3">Perfilado de Barba</option>
        <option value="4">Corte + Barba</option>
        <option value="5">Tinte o Color</option>
      </select>
      <input
        type="datetime-local"
        value={start}
        onChange={(e) => setStart(e.target.value)}
        required
        className="w-full px-4 py-2 rounded bg-zinc-800 text-white"
      />
      <textarea
        placeholder="Notas (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full px-4 py-2 rounded bg-zinc-800 text-white"
      />

      <button
        type="submit"
        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 px-4 rounded"
        disabled={loading}
      >
        {loading ? 'Reservando...' : 'Reservar Cita'}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && <p className="text-green-500 mt-2">✅ Cita creada exitosamente</p>}
    </form>
  )
}
