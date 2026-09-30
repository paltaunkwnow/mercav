import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BUSINESS_TYPES } from "@/lib/pos/business";

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
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { posConfig: true }
    });

    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: user.posConfig });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const parsed = configSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: "Revisá los datos de la configuración" }, { status: 400 });
    const data = { ...parsed.data, paymentMethods: Array.from(new Set(parsed.data.paymentMethods)) };

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { posConfig: { upsert: { update: data, create: data } } },
      include: { posConfig: true }
    });

    return NextResponse.json({ success: true, data: updatedUser.posConfig });
  } catch (error) {
    console.error("POS_CONFIG_POST_ERROR", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
