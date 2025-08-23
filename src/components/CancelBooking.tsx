//src/components/CancelBooking.tsx 
'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Phone, Trash2 } from 'lucide-react'

export default function CancelBooking() {
  const [whatsapp, setWhatsapp] = useState('')
  const [loading, setLoading] = useState(false)

  const normalize = (s: string) => s.replace(/\D+/g, '')

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault()
    const phone = normalize(whatsapp)

    if (!phone || phone.length < 8) {
      toast.error('Ingresa un WhatsApp válido')
      return
    }

    try {
      setLoading(true)
      const r = await fetch('/api/appointments/cancel-latest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp: phone }),
      })

      const j = (await r.json().catch(() => null)) as
        | { success?: boolean; ok?: boolean; error?: string; deletedId?: number }
        | null

      if (!r.ok || !(j?.success || j?.ok)) {
        throw new Error(j?.error || 'No se pudo cancelar la cita')
      }

      toast.success('Cita cancelada correctamente')
      setWhatsapp('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al cancelar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="w-full bg-[#0b0b0b] py-14 px-6">
      <div className="mx-auto max-w-3xl">
        {/* Card */}
        <div className="rounded-2xl border border-yellow-600/40 bg-[#111111] p-6 sm:p-8 shadow-[0_0_0_1px_rgba(255,200,0,0.03),0_10px_30px_rgba(0,0,0,0.6)]">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-yellow-600/50 bg-black/40 px-3 py-1 text-[11px] font-medium tracking-wide text-yellow-400">
              <Trash2 className="h-3.5 w-3.5" />
              Gestionar cita
            </span>
            <h3 className="mt-3 text-2xl sm:text-3xl font-bold text-white">
              Eliminar <span className="text-red-400">última cita</span>
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              Escribe tu número de WhatsApp y eliminaremos la <b>última</b> cita asociada
              a ese número. Esta acción es permanente.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleCancel} className="grid gap-4 sm:gap-5">
            <label className="text-sm text-gray-300">
              Número de WhatsApp
              <div className="mt-2 relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <Phone className="h-4 w-4 text-yellow-500" />
                </span>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="+56912345678"
                  className="w-full rounded-xl border border-yellow-600/60 bg-[#131313] px-10 py-3 text-base text-white placeholder:text-gray-500 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/30 transition"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>
            </label>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <p className="text-xs text-gray-400">
                * Solo aplica a la <b>última</b> cita creada con ese número.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-red-600 active:bg-red-700/90 disabled:opacity-60 disabled:cursor-not-allowed transition"
                title="Eliminar última cita"
              >
                <Trash2 className="h-4 w-4" />
                {loading ? 'Eliminando…' : 'Eliminar última cita'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
