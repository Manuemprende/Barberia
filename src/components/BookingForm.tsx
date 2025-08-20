'use client'

import { useEffect, useState } from 'react'
import { FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { FaUser, FaWhatsapp, FaCalendarAlt, FaClock, FaCut } from 'react-icons/fa';

type Service = { id: number; name: string; price: number; duration: number }
type Barber = { id: number; name: string }

export default function BookingForm() {
  const [services, setServices] = useState<Service[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
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
        setServices((await servicesRes.json().catch(() => [])) as Service[])
        setBarbers((await barbersRes.json().catch(() => [])) as Barber[])
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
        .then((arr: unknown) => Array.isArray(arr) ? setAvailableTimes(arr as string[]) : setAvailableTimes([]))
        .catch(() => toast.error('Error al obtener horarios'))
    } else {
      setAvailableTimes([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.date, form.barberId, form.serviceId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))

    if (name === 'serviceId') {
      const selected = services.find((s) => s.id === parseInt(value))
      setPrice(selected?.price ?? null)
      setDuration(selected?.duration ?? null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedDateTime = new Date(`${form.date}T${form.time}:00`)
      const now = new Date()
      if (selectedDateTime < now) {
        toast.error('No puedes agendar una cita en el pasado.')
        setLoading(false)
        return
      }

      const hour = selectedDateTime.getHours()
      if (hour < 9 || hour >= 19) {
        toast.error('El horario disponible es entre las 09:00 y las 19:00.')
        setLoading(false)
        return
      }

      const duplicateRes = await fetch('/api/check-duplicate-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp: form.whatsapp, date: form.date })
      })
      const duplicateData = (await duplicateRes.json().catch(() => ({}))) as { exists?: boolean }
      if (duplicateData.exists) {
        toast.error('Ya tienes una cita agendada ese día.')
        setLoading(false)
        return
      }

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

      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || 'Error al reservar')

      toast.success('Cita solicitada correctamente 🎉')
      setForm({ name: '', whatsapp: '', serviceId: '', barberId: '', date: '', time: '' })
      setPrice(null)
      setDuration(null)
      setAvailableTimes([])
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al procesar la cita')
    } finally {
      setLoading(false)
    }
  }

  return (
   <section id="booking" className="bg-black text-white py-20 px-6">
  <h2 className="font-bold text-center mb-8 text-4xl tracking-widest flex items-center justify-center gap-3">
    <FaCut className="text-yellow-500" /> Reserva tu cita
  </h2>

  <form onSubmit={handleSubmit}
        className="max-w-md mx-auto space-y-4 bg-[#131313] border border-yellow-600 rounded-xl shadow-lg p-8 backdrop-blur-md">
    {/* Campo Nombre con icono */}
    <div className="relative">
      <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500"/>
      <input
        type="text"
        name="name"
        placeholder="Nombre"
        value={form.name}
        onChange={handleChange}
        className="w-full pl-10 pr-4 py-2 rounded-md bg-white text-black border-2 border-yellow-600 focus:outline-none focus:border-yellow-500"
        required
      />
    </div>

    {/* Campo WhatsApp con icono */}
    <div className="relative">
      <FaWhatsapp className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500"/>
      <input
        type="tel"
        name="whatsapp"
        placeholder="WhatsApp"
        value={form.whatsapp}
        onChange={handleChange}
        className="w-full pl-10 pr-4 py-2 rounded-md bg-white text-black border-2 border-yellow-600 focus:outline-none focus:border-yellow-500"
        required
      />
    </div>

    {/* Selector de servicio */}
    <select
      name="serviceId"
      value={form.serviceId}
      onChange={handleChange}
      className="w-full px-4 py-2 rounded-md bg-white text-black border-2 border-yellow-600 focus:outline-none focus:border-yellow-500"
      required
    >
      <option value="">Selecciona un servicio</option>
      {services.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name} — ${new Intl.NumberFormat('es-CL').format(s.price)}
        </option>
      ))}
    </select>

    {/* Selector de barbero */}
    <select
      name="barberId"
      value={form.barberId}
      onChange={handleChange}
      className="w-full px-4 py-2 rounded-md bg-white text-black border-2 border-yellow-600 focus:outline-none focus:border-yellow-500"
      required
    >
      <option value="">Selecciona un barbero</option>
      {barbers.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name}
        </option>
      ))}
    </select>

    {/* Campo de fecha con icono */}
    <div className="relative">
      <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500"/>
      <input
        type="date"
        name="date"
        value={form.date}
        onChange={handleChange}
        className="w-full pl-10 pr-4 py-2 rounded-md bg-white text-black border-2 border-yellow-600 focus:outline-none focus:border-yellow-500"
        required
      />
    </div>

    {/* Selector de horario con icono */}
    <div className="relative">
      <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500"/>
      <select
        name="time"
        value={form.time}
        onChange={handleChange}
        className="w-full pl-10 pr-4 py-2 rounded-md bg-white text-black border-2 border-yellow-600 focus:outline-none focus:border-yellow-500"
        required
        disabled={!availableTimes.length}
      >
        <option value="">Selecciona un horario</option>
        {availableTimes.map((time) => (
          <option key={time} value={time}>{time}</option>
        ))}
      </select>
    </div>

    {/* Botón Reservar con degradado */}
    <button
      type="submit"
      className="w-full py-2 rounded-md font-semibold text-black bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 transition-all duration-200 shadow-md"
      disabled={loading}
    >
      {loading ? 'Reservando…' : 'Reservar'}
    </button>
  </form>
</section>

  )
}
