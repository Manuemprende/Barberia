'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export default function CancelBooking() {
  const [whatsapp, setWhatsapp] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/appointments/cancel-latest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp })
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error al cancelar')

      toast.success('Última cita cancelada correctamente.')
      setWhatsapp('')
    } catch (err: any) {
      toast.error(err.message || 'No se pudo cancelar la cita.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-black text-white py-20 px-6">
      <div className="max-w-md mx-auto text-center space-y-6">
        <h2 className="text-3xl font-bold text-yellow-500">
          ¿Necesitas cancelar tu cita?
        </h2>
        <p className="text-gray-300 text-sm">
          Ingresa tu número de WhatsApp y cancelaremos la última cita que tengas agendada.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Tu número de WhatsApp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-md bg-zinc-800 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition"
          >
            {loading ? 'Cancelando...' : 'Cancelar cita'}
          </button>
        </form>
      </div>
    </section>
  )
}
