import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@mercav.lat";
  const userEmail = "vipasa.gbc@gmail.com";
  
  console.log("Iniciando limpieza masiva de sanciones...");

  // 1. Limpiar TODAS las sanciones de la DB
  const unsanctionedCount = await prisma.user.updateMany({
    data: {
      isSanctioned: false,
      sanctionReason: null,
      sanctionExpiresAt: null
    }
  });
  console.log(`Sanciones eliminadas: ${unsanctionedCount.count}`);

  // 2. Asegurar que ambos tengan el rol ADMIN
  const targets = [adminEmail, userEmail];

  for (const email of targets) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (user) {
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
      console.log(`Rol ADMIN asegurado para: ${email}`);
    }
  }

  console.log("¡Cuentas restauradas!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
// creado por pato dev y askforvini
