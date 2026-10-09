import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { BUSINESS_TYPES } from "@/lib/pos/business";
import { requireManager } from "@/lib/pos/staff";
import { getPosScope } from "@/lib/pos/server";

const configSchema = z.object({
  shopName: z.string().max(120).nullish(),
  logoUrl: z.string().max(2000).nullish(),
  currency: z.string().min(3).max(3).default("USD"),
  country: z.string().max(80).nullish(),
  department: z.string().max(80).nullish(),
  city: z.string().max(80).nullish(),
  address: z.string().max(200).nullish(),
  businessType: z.enum(BUSINESS_TYPES.map((b) => b.id) as [string, ...string[]]).default("GENERAL"),
  taxName: z.string().trim().min(1).max(20).default("IVA"),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  pricesIncludeTax: z.boolean().default(true),
  paymentMethods: z.array(z.enum(["CASH", "CARD", "TRANSFER", "QR", "OTHER"])).min(1).default(["CASH"]),
  // Mercav Kosher place to publish stock to; only places this user manages.
  kosherPlaceId: z.string().max(64).nullish(),
});

export async function GET(req: Request) {
  try {
    // La caja de empresa todavía sin activar devuelve null: la pantalla muestra el alta.
    const res = await getPosScope(req, "pos.sell");
    if (!res.ok) return res.response;
    return NextResponse.json({ success: true, data: res.scope.config });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const res = await getPosScope(req, "pos.configure");
    if (!res.ok) return res.response;
    const { scope } = res;
    if (scope.config) {
      const gate = await requireManager(req, scope.config.id);
      if (!gate.ok) return gate.response;
    }

    const parsed = configSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: "Revisá los datos de la configuración" }, { status: 400 });
    const data = { ...parsed.data, paymentMethods: Array.from(new Set(parsed.data.paymentMethods)) };
    if (data.kosherPlaceId) {
      const manages = await prisma.kosherPlaceManager.findUnique({
        where: { placeId_userId: { placeId: data.kosherPlaceId, userId: scope.userId } },
        select: { placeId: true },
      });
      if (!manages) return NextResponse.json({ success: false, error: "Solo podés vincular un lugar de Mercav Kosher que administrás" }, { status: 403 });
    }

    const config = scope.workspaceId
      ? await prisma.pOSConfig.upsert({ where: { workspaceId: scope.workspaceId }, update: data, create: { ...data, workspaceId: scope.workspaceId } })
      : await prisma.pOSConfig.upsert({ where: { userId: scope.userId }, update: data, create: { ...data, userId: scope.userId } });

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error("POS_CONFIG_POST_ERROR", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
