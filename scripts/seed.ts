// scripts/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // ── Servicios
  const services = await prisma.service.createMany({
    data: [
      { name: 'Corte Clásico', price: 8000, duration: 45 },
      { name: 'Afeitado Premium', price: 6000, duration: 30 },
      { name: 'Perfilado de Barba', price: 5000, duration: 30 },
      { name: 'Corte + Barba', price: 12000, duration: 60 },
      { name: 'Tinte o Color', price: 15000, duration: 60 },
    ],
    skipDuplicates: true,
  })

  // ── Barberos
  const [manuel, sofia] = await Promise.all([
    prisma.barber.upsert({
      where: { id: 1 },
      update: {},
      create: { name: 'Manuel Torres', specialties: 'Cortes clásicos, fade' },
    }),
    prisma.barber.upsert({
      where: { id: 2 },
      update: {},
      create: { name: 'Sofía Rojas', specialties: 'Barba, perfilado' },
    }),
  ])

  // ── Admin (email + pass)
  const email = 'admin@cortemaestro.cl'
  const plain = '123456789'
  const hash = await bcrypt.hash(plain, 10)

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Admin',
      password: hash,
      role: 'ADMIN',
    },
  })

  // ── (Opcional) una cita de ejemplo hoy a las 11:30
  const today = new Date()
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    11, 30, 0, 0
  )
  const end = new Date(start.getTime() + 45 * 60000)

  const corteClasico = await prisma.service.findFirst({ where: { name: 'Corte Clásico' } })

  if (corteClasico) {
    await prisma.appointment.upsert({
      where: { id: 1 },
      update: {},
      create: {
        customerName: 'Juan Lopez',
        whatsapp: '+56928148914',
        barberId: manuel.id,
        serviceId: corteClasico.id,
        start,
        end,
        status: 'SCHEDULED',
      },
    })
  }

  console.log('✅ Seed listo')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })