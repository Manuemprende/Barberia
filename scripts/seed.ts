import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  // 🔁 Limpia la base para evitar duplicados
  await prisma.appointment.deleteMany()
  await prisma.barber.deleteMany()
  await prisma.service.deleteMany()

  // ✂️ Crea servicios
  const services = await prisma.service.createMany({
    data: [
      { name: 'Corte Clásico', price: 8000, duration: 45 },
      { name: 'Afeitado Premium', price: 6000, duration: 30 },
      { name: 'Perfilado de Barba', price: 5000, duration: 30 },
      { name: 'Corte + Barba', price: 12000, duration: 60 },
      { name: 'Tinte o Color', price: 15000, duration: 60 },
    ]
  })

  // 💈 Crea barberos
  const barbero1 = await prisma.barber.create({
    data: {
      name: 'Juan Cortes',
      specialties: 'Cortes modernos y afeitados',
      available: true,
    },
  })

  const barbero2 = await prisma.barber.create({
    data: {
      name: 'Pedro Estilo',
      specialties: 'Barba, color y corte clásico',
      available: true,
    },
  })

  // 🕒 Crea una cita realista para testing

  const appointmentStart = new Date()
  appointmentStart.setHours(appointmentStart.getHours() + 2) // cita 2 horas más adelante

  // Busca el servicio Corte Clásico
  const corteClasico = await prisma.service.findFirst({
    where: { name: 'Corte Clásico' }
  })

  if (!corteClasico) {
    throw new Error('Servicio Corte Clásico no encontrado')
  }

  // Calcula la hora de término (end = start + duración)
  const appointmentEnd = new Date(
    appointmentStart.getTime() + corteClasico.duration * 60 * 1000
  )

  // Crea la cita
  await prisma.appointment.create({
    data: {
      start: appointmentStart,
      end: appointmentEnd,
      barberId: barbero1.id,
      serviceId: corteClasico.id,
      customerName: "Cliente Demo",
      whatsapp: "+56912345678",
      notes: "Cita generada desde el script seed"
    }
  })

  console.log('✅ Seeding completo.')
}

main()
  .catch((e) => {
    console.error('❌ Error en el seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
