import { PrismaClient } from "@prisma/client";

function getDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  // Supabase connection pooling (Supavisor/PgBouncer) requires pgbouncer=true
  // to prevent 'prepared statement "s0" already exists' errors.
  if (
    (url.includes("supabase.co") || url.includes("pooler.supabase.com") || url.includes(":6543")) &&
    !url.includes("pgbouncer=true")
  ) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}pgbouncer=true`;
  }
  return url;
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const dbUrl = getDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient(
    dbUrl
      ? {
          datasources: {
            db: {
              url: dbUrl,
            },
          },
        }
      : undefined
  );

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
// creado por pato dev y askforvini
