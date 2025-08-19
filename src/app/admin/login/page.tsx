'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        throw new Error(j.error || 'Login inválido')
      }
      toast.success('¡Bienvenido!')
      router.push('/admin') // dashboard
    } catch (err: any) {
      toast.error(err?.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-zinc-900 border border-zinc-800 p-6 rounded-xl space-y-4">
        <h1 className="text-2xl font-bold text-yellow-500 text-center">Corte Maestro · Admin</h1>
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full bg-zinc-800 px-3 py-2 rounded border border-zinc-700"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full bg-zinc-800 px-3 py-2 rounded border border-zinc-700"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-500 text-black font-semibold py-2 rounded hover:bg-yellow-400 transition"
        >
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </main>
  )
}
