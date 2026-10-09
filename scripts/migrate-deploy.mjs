// Aplica las migraciones pendientes (prisma migrate deploy) antes del build, solo en el deploy de producción de Vercel.
// Sin esto, el build generaba el cliente de Prisma pero la base de producción se quedaba sin las tablas nuevas
// (pasó con Business: "The table public.BusinessMember does not exist").
//
// - Las previews y los builds locales no tocan la base.
// - El pooler de Supabase en modo transacción (puerto 6543) no admite migraciones: se usa el mismo host en modo
//   sesión (5432), o DIRECT_URL si está cargada.
// - Si una migración falla, el build falla y producción sigue con la versión anterior.
import { spawnSync } from "node:child_process";

if (process.env.VERCEL_ENV !== "production") {
  console.log("[migraciones] No es el deploy de producción: no se aplican.");
  process.exit(0);
}

const raw = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!raw) {
  console.error("[migraciones] Falta DATABASE_URL.");
  process.exit(1);
}

let url = raw;
try {
  const parsed = new URL(raw);
  if (!process.env.DIRECT_URL && parsed.hostname.endsWith("pooler.supabase.com") && parsed.port === "6543") parsed.port = "5432";
  parsed.searchParams.delete("pgbouncer");
  url = parsed.toString();
} catch {
  // Una URL que no se puede leer se usa tal cual; Prisma dirá qué le falta.
}

console.log("[migraciones] Aplicando las migraciones pendientes…");
const result = spawnSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });
process.exit(result.status ?? 1);
// creado por pato dev y askforvini
