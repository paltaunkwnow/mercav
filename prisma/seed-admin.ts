import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = "admin@mercav.lat";
  const password = "8dejunioxD!";
  const hashedPassword = await bcrypt.hash(password, 12);

  console.log("Creando super-administrador...");

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {
      password: hashedPassword,
      isVerified: true,
    },
    create: {
      email: email.toLowerCase(),
      name: "Super Administrador",
      username: "admin",
      password: hashedPassword,
      isVerified: true,
    },
  });

  // Asegurar que tenga el rol ADMIN
  await prisma.userRole.upsert({
    where: {
      userId_role: {
        userId: user.id,
        role: "ADMIN"
      }
    },
    update: {},
    create: {
      userId: user.id,
      role: "ADMIN"
    }
  });

  console.log("¡Admin creado exitosamente!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
