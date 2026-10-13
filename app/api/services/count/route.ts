import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Sin esto, Next la armaba una sola vez en el build y servía siempre esos conteos (o el error, si la base fallaba).
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const counts = await prisma.service.groupBy({
      by: ['category'],
      _count: {
        id: true
      },
      where: {
        isActive: true
      }
    });

    // Map to a more usable format
    const categoryCounts = counts.reduce((acc: any, curr) => {
      acc[curr.category] = curr._count.id;
      return acc;
    }, {});

    return NextResponse.json({ success: true, data: categoryCounts });
  } catch (error) {
    console.error("Error fetching service counts:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
