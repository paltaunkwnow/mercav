import { prisma } from "@/lib/prisma";

export const ALERT_TOPICS = {
  stock: "Stock kosher en sucursales",
  agenda: "Eventos de la agenda",
  minian: "Minianim nuevos",
  jesed: "Pedidos de jésed",
} as const;

export type AlertTopic = keyof typeof ALERT_TOPICS;

const MAX_RECIPIENTS = 500;

/** Notifies members who subscribed to `topic` in this city. Never blocks the caller's write. */
export async function notifyCity(input: {
  city: string;
  countryCode: string;
  topic: AlertTopic;
  title: string;
  body: string;
  link: string;
  exclude?: string;
}) {
  try {
    const alerts = await prisma.kosherAlert.findMany({
      where: { city: input.city, countryCode: input.countryCode, topics: { has: input.topic }, userId: input.exclude ? { not: input.exclude } : undefined },
      select: { userId: true },
      take: MAX_RECIPIENTS,
    });
    if (alerts.length === 0) return;
    await prisma.notification.createMany({
      data: alerts.map((a) => ({ userId: a.userId, type: "kosher", title: input.title, body: input.body.slice(0, 280), link: input.link })),
    });
  } catch (error) {
    console.error("Kosher alert delivery failed", error);
  }
}

export async function notifyUser(userId: string, title: string, body: string, link: string) {
  try {
    await prisma.notification.create({ data: { userId, type: "kosher", title, body: body.slice(0, 280), link } });
  } catch (error) {
    console.error("Kosher notification failed", error);
  }
}

/** One reminder per place and expiry date, created when the manager opens Mercav Kosher. */
export async function remindExpiringCertificates(userId: string) {
  const soon = new Date(Date.now() + 21 * 86_400_000);
  const places = await prisma.kosherPlace.findMany({
    where: { managers: { some: { userId } }, certExpiresAt: { not: null, lte: soon } },
    select: { slug: true, name: true, certExpiresAt: true },
  });
  for (const p of places) {
    const link = `/kosher/lugar/${p.slug}/administrar?cert=${p.certExpiresAt!.toISOString().slice(0, 10)}`;
    const exists = await prisma.notification.findFirst({ where: { userId, type: "kosher_cert", link }, select: { id: true } });
    if (exists) continue;
    const expired = p.certExpiresAt! < new Date();
    await prisma.notification.create({
      data: {
        userId,
        type: "kosher_cert",
        title: expired ? `El certificado de ${p.name} venció` : `El certificado de ${p.name} vence pronto`,
        body: "Subí el certificado renovado para que la ficha siga mostrando «Certificado».",
        link,
      },
    });
  }
}
