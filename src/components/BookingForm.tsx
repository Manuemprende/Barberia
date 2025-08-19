'use client'

import { useEffect, useState } from 'react'
import { FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa'
import toast from 'react-hot-toast'

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
      {/* ... (tu mismo JSX sin cambios) ... */}
    </section>
  )
}
