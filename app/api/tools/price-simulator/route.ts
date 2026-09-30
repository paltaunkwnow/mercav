import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { checkToolAccess } from "@/lib/toolAccess";
import { PRICE_REFERENCE } from "@/lib/price-reference";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const access = await checkToolAccess(user.id, "price-simulator");
    if (!access.allowed) return NextResponse.json({ success: false, error: access.message }, { status: 403 });

    const body = await req.json();
    const category = String(body.category || "desarrollo web").toLowerCase();
    const region = String(body.region || "global").toLowerCase();
    const experienceYears = Number(body.experienceYears || 0);
    const deliveryType = String(body.deliveryType || "estándar").toLowerCase();
    const hours = Number(body.hours || 0);

    const reference = PRICE_REFERENCE[category] || PRICE_REFERENCE["desarrollo web"];
    const row = reference[region as keyof typeof reference] || reference.global;

    const experienceMultiplier = experienceYears >= 5 ? 1.35 : experienceYears >= 2 ? 1.15 : 1;
    const deliveryMultiplier = deliveryType.includes("premium") ? 1.35 : deliveryType.includes("básico") || deliveryType.includes("basico") ? 0.9 : 1;

    const min = Math.round(row.min * experienceMultiplier * deliveryMultiplier * hours);
    const avg = Math.round(row.avg * experienceMultiplier * deliveryMultiplier * hours);
    const premium = Math.round(row.premium * experienceMultiplier * deliveryMultiplier * hours);
    const hourly = Math.round(row.hourly * experienceMultiplier * deliveryMultiplier);

    const result = { category, region, experienceYears, deliveryType, hours, min, avg, premium, hourly };

    await prisma.toolUsage.create({ data: { userId: user.id, toolName: "price-simulator", inputData: body, outputData: result } }).catch(() => {});

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Price simulator error", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
