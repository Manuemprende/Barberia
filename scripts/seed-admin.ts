import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@cortemaestro.cl'
  const plain = 'Admin123!' // cámbiala luego

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    console.log('Admin ya existe')
    return
  }

  const hash = await bcrypt.hash(plain, 10)
  await prisma.user.create({
    data: {
      email,
      name: 'Admin',
      password: hash,
      role: 'ADMIN'
    }
  })
  console.log('Admin creado:', email, 'pass:', plain)
}

main().finally(() => prisma.$disconnect())
