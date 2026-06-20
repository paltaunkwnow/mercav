import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { isSanctioned: true },
    select: { email: true, name: true, isSanctioned: true }
  });
  console.log("Usuarios sancionados actualmente:");
  console.log(users);
}

main().finally(() => prisma.$disconnect());
