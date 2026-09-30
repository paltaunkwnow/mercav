import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { cityBySlug } from "@/lib/kosher/cities";
import { ALERT_TOPICS, type AlertTopic } from "@/lib/kosher/notify";
import { getKosherViewer, kosherError, unauthorized } from "@/lib/kosher/server";

const schema = z.object({
  citySlug: z.string().min(1),
  topics: z.array(z.enum(Object.keys(ALERT_TOPICS) as [AlertTopic, ...AlertTopic[]])).max(4),
});

export async function PUT(request: NextRequest) {
  const viewer = await getKosherViewer();
  if (!viewer) return unauthorized();
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return kosherError(400, "Alertas no válidas");
  const city = await cityBySlug(parsed.data.citySlug);
  if (!city) return kosherError(400, "Ciudad no encontrada");

  const key = { userId_city_countryCode: { userId: viewer.id, city: city.city, countryCode: city.countryCode } };
  const topics = [...new Set(parsed.data.topics)];
  if (topics.length === 0) {
    await prisma.kosherAlert.deleteMany({ where: key.userId_city_countryCode });
  } else {
    await prisma.kosherAlert.upsert({
      where: key,
      create: { userId: viewer.id, city: city.city, countryCode: city.countryCode, topics },
      update: { topics },
    });
  }
  return NextResponse.json({ success: true, message: topics.length ? `Alertas de ${city.city} actualizadas.` : `Sin alertas en ${city.city}.` });
}
