// Cuenta de QA para la base de desarrollo. Lee QA_EMAIL y QA_PASSWORD de .env.local (nunca del código) y se niega a
// correr si DATABASE_URL no apunta a una base local. Idempotente: si la cuenta existe, le repone la contraseña.
// Run with: npm run seed:qa
import prismaPkg from "@prisma/client";
import bcrypt from "bcryptjs";

const { PrismaClient } = prismaPkg;

const email = process.env.QA_EMAIL?.trim().toLowerCase();
const password = process.env.QA_PASSWORD;
if (!email || !password || password.length < 12) {
  throw new Error("Definí QA_EMAIL y QA_PASSWORD (mínimo 12 caracteres) en .env.local.");
}

const host = (() => {
  try {
    return new URL(process.env.DATABASE_URL ?? "").hostname;
  } catch {
    return "";
  }
})();
if (!["localhost", "127.0.0.1", "::1"].includes(host) && !host.endsWith(".localhost")) {
  throw new Error("La cuenta de QA solo se crea en una base local; DATABASE_URL apunta a otro host.");
}

const prisma = new PrismaClient();

async function upsertAccount(mail: string, pass: string, name: string, username: string) {
  const hashed = await bcrypt.hash(pass, 12);
  const user = await prisma.user.upsert({
    where: { email: mail },
    update: { password: hashed, isVerified: true, twoFactorEnabled: false },
    create: { email: mail, name, username, password: hashed, isVerified: true },
  });
  console.log(`Cuenta de QA lista (${user.email}).`);
}

async function main() {
  await upsertAccount(email!, password!, "Lucía Prueba", "qa-mercav");
  // Segunda cuenta opcional: el cliente o el trabajador invitado (para probar vinculación y caja con roles).
  const email2 = process.env.QA2_EMAIL?.trim().toLowerCase();
  const password2 = process.env.QA2_PASSWORD;
  if (email2 && password2 && password2.length >= 12) await upsertAccount(email2, password2, "Mateo Cliente", "qa-mercav-2");
  // Tercera cuenta opcional: una clienta que no es parte de ningún equipo (vincular tarjetas).
  const email3 = process.env.QA3_EMAIL?.trim().toLowerCase();
  const password3 = process.env.QA3_PASSWORD;
  if (email3 && password3 && password3.length >= 12) await upsertAccount(email3, password3, "Ana Clienta", "qa-mercav-3");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
// creado por pato dev y askforvini
