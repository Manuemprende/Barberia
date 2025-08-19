'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export default function CancelBooking() {
  const [code, setCode] = useState('')

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const r = await fetch('/api/appointments/cancel-latest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const j = (await r.json().catch(() => null)) as { ok?: boolean; error?: string } | null
      if (!r.ok || !j?.ok) throw new Error(j?.error || 'No se pudo cancelar')
      toast.success('Cita cancelada')
      setCode('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al cancelar')
    }
  }

  return (
    <form onSubmit={handleCancel} className="max-w-md mx-auto my-8 space-y-3">
      {/* tu UI */}
    </form>
  )
}
