'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

export default function CommentsForm() {
  const [form, setForm] = useState({
    nombre: '',
    comentario: ''
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.nombre.trim() || !form.comentario.trim()) {
      toast.error('Completa todos los campos antes de enviar.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.nombre,
          message: form.comentario
        })
      })

      if (!res.ok) throw new Error('Error al guardar comentario')
      toast.success('¡Gracias por tu comentario!')

      setForm({ nombre: '', comentario: '' })
    } catch {
      toast.error('Hubo un error al enviar tu comentario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="comentarios" className="bg-black text-white py-20 px-6">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <h2 className="text-3xl font-bold text-yellow-500">¿Qué te pareció tu visita?</h2>
        <p className="text-gray-400">Déjanos tu comentario y ayúdanos a mejorar tu experiencia en Corte Maestro.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5 text-left">
          <div>
            <label className="block mb-1 text-sm text-gray-300">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault()
              }}
              placeholder="Tu nombre"
              required
              className="w-full px-4 py-2 rounded-md bg-zinc-800 text-white border border-zinc-700 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm text-gray-300">Comentario</label>
            <textarea
              name="comentario"
              value={form.comentario}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) e.preventDefault()
              }}
              placeholder="Escribe tu experiencia..."
              required
              rows={4}
              className="w-full px-4 py-2 rounded-md bg-zinc-800 text-white border border-zinc-700 focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-yellow-500 text-black font-semibold rounded-md hover:bg-yellow-400 transition"
          >
            {loading ? 'Enviando...' : 'Enviar Comentario'}
          </button>
        </form>
      </div>
    </section>
  )
}
