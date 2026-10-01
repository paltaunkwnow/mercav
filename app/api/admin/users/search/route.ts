import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    // Solo ADMIN: los roles viven en session.user.roles (UserRole[] en la base)
    if (!session.user.roles?.includes("ADMIN")) {
      return NextResponse.json({ error: "Prohibido" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim().slice(0, 100);

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, data: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: query,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
      },
      take: 5,
    });

    // El frontend (BadgesTab) espera `image`; en User el campo es `avatar`.
    return NextResponse.json({
      success: true,
      data: users.map(({ avatar, ...u }) => ({ ...u, image: avatar })),
    });
  } catch (error) {
    console.error("Search Users Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
