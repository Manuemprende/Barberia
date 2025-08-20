'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { FaUser, FaRegCommentDots } from 'react-icons/fa';

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
    <p className="text-gray-400">
      Déjanos tu comentario y ayúdanos a mejorar tu experiencia en Corte Maestro.
    </p>

    <form onSubmit={handleSubmit}
          className="mt-8 space-y-4 text-left border-2 border-yellow-500 p-6 rounded-xl bg-[#131313] shadow-md">
      {/* Campo nombre */}
      <div className="flex flex-col space-y-1">
        <label className="font-medium text-sm text-gray-300">Nombre</label>
        <div className="relative">
          {/* Icono opcional */}
          <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500" />
          <input
            type="text"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Tu nombre"
            className="w-full pl-10 pr-4 py-2 bg-white text-black rounded-md border-2 border-yellow-500 focus:outline-none focus:border-yellow-600"
            required
          />
        </div>
      </div>

      {/* Campo comentario */}
      <div className="flex flex-col space-y-1">
        <label className="font-medium text-sm text-gray-300">Comentario</label>
        <div className="relative">
          {/* Icono opcional */}
          <FaRegCommentDots className="absolute left-3 top-3 text-yellow-500" />
          <textarea
            name="comentario"
            value={form.comentario}
            onChange={handleChange}
            placeholder="Escribe tu experiencia…"
            rows={4}
            className="w-full pl-10 pr-4 py-2 bg-white text-black rounded-md border-2 border-yellow-500 focus:outline-none focus:border-yellow-600 resize-none"
            required
          ></textarea>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 rounded-md font-semibold text-black bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 transition-colors"
      >
        {loading ? 'Enviando…' : 'Enviar Comentario'}
      </button>
    </form>
  </div>
</section>
  )
}
