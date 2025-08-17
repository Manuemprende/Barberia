import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456789', 10);

  await prisma.user.upsert({
    where: { email: 'admin@cortemaestro.cl' },
    update: { password: passwordHash, name: 'Admin' },
    create: {
      email: 'admin@cortemaestro.cl',
      name: 'Admin',
      password: passwordHash,
    },
  });
}

main().finally(() => prisma.$disconnect());
