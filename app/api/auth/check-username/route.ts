import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");
  
  if (!username) {
    return NextResponse.json({ success: false, error: "Falta el parámetro username" }, { status: 400 });
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { username }
    });
    
    return NextResponse.json({
      success: true,
      data: { available: !user }
    });
  } catch (error) {
    console.error("Error al chequear username:", error);
    return NextResponse.json({ success: false, error: "Error interno" }, { status: 500 });
  }
}
// creado por pato dev y askforvini
