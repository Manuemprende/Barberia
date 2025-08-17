'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Toaster, toast } from 'react-hot-toast'
import { FaLock, FaUser } from 'react-icons/fa'

export default function AdminLoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Error de autenticación')
      }
      toast.success('Bienvenido 👋')
      router.push(next)
    } catch (e: any) {
      toast.error(e.message || 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black text-white p-6">
      <Toaster position="top-center" />
      <div className="w-full max-w-md bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 shadow-xl backdrop-blur-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 text-yellow-500 text-2xl font-bold">
            <FaLock />
            <span>Panel Admin</span>
          </div>
          <p className="text-zinc-400 mt-2">Ingresa con tus credenciales</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-zinc-300">Correo</label>
            <div className="relative">
              <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-800 pl-10 pr-3 py-2 rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="admin@cortemaestro.cl"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1 text-zinc-300">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-zinc-800 px-3 py-2 rounded-md border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-md bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition"
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </main>
  )
}
