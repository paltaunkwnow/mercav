// Aplica las migraciones pendientes (prisma migrate deploy) antes del build, solo en el deploy de producción de Vercel.
// Sin esto, el build generaba el cliente de Prisma pero la base de producción se quedaba sin las tablas nuevas
// (pasó con Business: "The table public.BusinessMember does not exist").
//
// - Las previews y los builds locales no tocan la base.
// - El pooler de Supabase en modo transacción (puerto 6543) no admite migraciones: se usa el mismo host en modo
//   sesión (5432), o DIRECT_URL si está cargada.
// - Si una migración falla, el build falla y producción sigue con la versión anterior.
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

/**
 * URL para migraciones y scripts del build: DIRECT_URL, o DATABASE_URL con el pooler de Supabase en modo sesión.
 * También la usa scripts/kosher/import-osm.mjs.
 */
export function sessionDatabaseUrl(env = process.env) {
  const raw = env.DIRECT_URL || env.DATABASE_URL;
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (!env.DIRECT_URL && parsed.hostname.endsWith("pooler.supabase.com") && parsed.port === "6543") parsed.port = "5432";
    parsed.searchParams.delete("pgbouncer");
    return parsed.toString();
  } catch {
    // Una URL que no se puede leer se usa tal cual; Prisma dirá qué le falta.
    return raw;
  }
}

function main() {
  if (process.env.VERCEL_ENV !== "production") {
    console.log("[migraciones] No es el deploy de producción: no se aplican.");
    process.exit(0);
  }

  const url = sessionDatabaseUrl();
  if (!url) {
    console.error("[migraciones] Falta DATABASE_URL.");
    process.exit(1);
  }

  console.log("[migraciones] Aplicando las migraciones pendientes…");
  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit", env: { ...process.env, DATABASE_URL: url } });
  process.exit(result.status ?? 1);
}

// Solo corre cuando se ejecuta como script, no cuando otro script importa sessionDatabaseUrl.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
// creado por pato dev y askforvini
