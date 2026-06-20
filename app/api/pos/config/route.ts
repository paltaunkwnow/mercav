import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const body = await req.json();
    const { shopName, logoUrl, currency, country, department, city, address } = body;

    // Use nested update to bypass direct model reference issues
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        posConfig: {
          upsert: {
            update: {
              shopName,
              logoUrl,
              currency: currency || "USD",
              country,
              department,
              city,
              address
            },
            create: {
              shopName,
              logoUrl,
              currency: currency || "USD",
              country,
              department,
              city,
              address
            }
          }
        }
      },
      include: { posConfig: true }
    });

    return NextResponse.json({ success: true, data: updatedUser.posConfig });
  } catch (error) {
    console.error("POS_CONFIG_POST_ERROR", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
