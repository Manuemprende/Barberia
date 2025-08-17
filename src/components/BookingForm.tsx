'use client'

import { useEffect, useState } from 'react'
import { FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa'
import toast from 'react-hot-toast'

export default function BookingForm() {
  const [services, setServices] = useState([])
  const [barbers, setBarbers] = useState([])
  const [availableTimes, setAvailableTimes] = useState<string[]>([])

  const [form, setForm] = useState({
    name: '',
    whatsapp: '',
    serviceId: '',
    barberId: '',
    date: '',
    time: ''
  })

  const [loading, setLoading] = useState(false)
  const [price, setPrice] = useState<number | null>(null)
  const [duration, setDuration] = useState<number | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [servicesRes, barbersRes] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/barbers')
        ])
        const servicesData = await servicesRes.json()
        const barbersData = await barbersRes.json()
        setServices(servicesData)
        setBarbers(barbersData)
      } catch {
        toast.error('Error al cargar servicios o barberos')
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const { date, barberId, serviceId } = form
    if (date && barberId && serviceId) {
      fetch('/api/available-times', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: parseInt(barberId),
          serviceId: parseInt(serviceId),
          date
        })
      })
        .then(res => res.json())
        .then(setAvailableTimes)
        .catch(() => toast.error('Error al obtener horarios'))
    } else {
      setAvailableTimes([])
    }
  }, [form.date, form.barberId, form.serviceId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))

    if (name === 'serviceId') {
      const selected = services.find((s: any) => s.id === parseInt(value))
      setPrice(selected?.price ?? null)
      setDuration(selected?.duration ?? null)
    }
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)

  try {
    // ✅ Validar si la hora seleccionada es en el pasado
    const selectedDateTime = new Date(`${form.date}T${form.time}:00`)
    const now = new Date()
    if (selectedDateTime < now) {
      toast.error('No puedes agendar una cita en el pasado.')
      setLoading(false)
      return
    }

    // ✅ Validar si la hora está fuera del horario laboral (ej: 9:00 a 19:00)
    const hour = selectedDateTime.getHours()
    if (hour < 9 || hour >= 19) {
      toast.error('El horario disponible es entre las 09:00 y las 19:00.')
      setLoading(false)
      return
    }

    // ✅ Validar duplicado por WhatsApp y fecha
    const duplicateRes = await fetch('/api/check-duplicate-appointment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whatsapp: form.whatsapp, date: form.date })
    })

    const duplicateData = await duplicateRes.json()
    if (duplicateData.exists) {
      toast.error('Ya tienes una cita agendada ese día.')
      setLoading(false)
      return
    }

    // ✅ Crear cita
    const res = await fetch('/api/appointments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    customerName: form.name,
    whatsapp: form.whatsapp,
    serviceId: parseInt(form.serviceId),
    barberId: parseInt(form.barberId),
    start: selectedDateTime.toISOString(),
    notes: ''
  })
})

// ✅ primero verifica ok; si no, intenta leer JSON y si no hay, usa texto
if (!res.ok) {
  let msg = 'Error al reservar'
  try {
    const maybeJson = await res.json()
    msg = maybeJson?.error || msg
  } catch {
    const txt = await res.text()
    if (txt) msg = txt
  }
  throw new Error(msg)
}

const data = await res.json()

    toast.success('Cita solicitada correctamente 🎉')
    setForm({ name: '', whatsapp: '', serviceId: '', barberId: '', date: '', time: '' })
    setPrice(null)
    setDuration(null)
    setAvailableTimes([])

  } catch (error: any) {
    toast.error(error.message || 'Error al procesar la cita')
  } finally {
    setLoading(false)
  }
}



  return (
    <section id="booking" className="bg-black text-white py-20 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-start">
        {/* LADO IZQUIERDO */}
        <div>
          <span className="px-4 py-1 rounded-full bg-zinc-800 text-xs uppercase tracking-wider text-white inline-block mb-3">
            Reserva Tu Silla
          </span>
          <h2 className="text-4xl font-bold mb-4">Reserva tu Cita</h2>
          <p className="text-gray-400 mb-8">
            ¿Listo para el tratamiento Maestro? Completa el formulario para solicitar tu lugar.
          </p>

          <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
            <h3 className="text-xl font-semibold mb-4 text-white">Contacto y Ubicación</h3>
            <ul className="space-y-4 text-gray-300 text-sm">
              <li className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-yellow-500 mt-1" />
                <span>Avenida Siempreviva 742, Santiago</span>
              </li>
              <li className="flex items-start gap-3">
                <FaPhone className="text-yellow-500 mt-1" />
                <span>+56 9 1234 5678</span>
              </li>
              <li className="flex items-start gap-3">
                <FaEnvelope className="text-yellow-500 mt-1" />
                <span>contacto@cortemaestro.cl</span>
              </li>
            </ul>
          </div>
        </div>

        {/* LADO DERECHO: FORMULARIO */}
        <form onSubmit={handleSubmit} className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 space-y-5">
          <input
            name="name"
            placeholder="Tu nombre"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full bg-zinc-800 px-4 py-2 rounded text-white"
          />

          <input
            name="whatsapp"
            placeholder="Tu WhatsApp"
            value={form.whatsapp}
            onChange={handleChange}
            required
            className="w-full bg-zinc-800 px-4 py-2 rounded text-white"
          />

          <select
            name="serviceId"
            value={form.serviceId}
            onChange={handleChange}
            required
            className="w-full bg-zinc-800 px-4 py-2 rounded text-white"
          >
            <option value="">Selecciona un servicio</option>
            {services.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            name="barberId"
            value={form.barberId}
            onChange={handleChange}
            required
            className="w-full bg-zinc-800 px-4 py-2 rounded text-white"
          >
            <option value="">Selecciona un barbero</option>
            {barbers.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* FECHA Y HORA EN UNA FILA */}
          <div className="flex gap-4">
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
              className="w-1/2 bg-zinc-800 px-4 py-2 rounded text-white"
            />

            <select
              name="time"
              value={form.time}
              onChange={handleChange}
              required
              className="w-1/2 bg-zinc-800 px-4 py-2 rounded text-white"
            >
              <option value="">Selecciona una hora</option>
              {availableTimes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {(price !== null && duration !== null) && (
            <div className="text-yellow-400 text-center font-bold">
              Valor: ${price.toLocaleString()} CLP · Duración: {duration} min
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 text-black font-semibold py-3 rounded"
          >
            {loading ? 'Enviando...' : 'Solicitar Cita'}
          </button>
        </form>
      </div>
    </section>
  )
}
