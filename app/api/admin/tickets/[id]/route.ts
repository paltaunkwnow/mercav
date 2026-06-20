import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).roles?.includes("ADMIN")) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { status } = body;

    const ticket = await prisma.ticket.update({
      where: { id: params.id },
      data: { status }
    });

    return NextResponse.json({ success: true, data: ticket });
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).roles?.includes("ADMIN")) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    await prisma.ticket.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
