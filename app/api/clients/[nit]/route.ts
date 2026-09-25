import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { nit: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const nit = params.nit.trim();

    const client = await prisma.billingClient.findUnique({
      where: { nit }
    });

    if (!client) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: client });
  } catch (error: any) {
    console.error("CLIENT_GET_NIT_ERROR", error);
    return NextResponse.json({ success: false, error: "Internal Error" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
