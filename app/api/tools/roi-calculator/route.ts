import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ success: false, error: 'Usuario no encontrado' }, { status: 404 });

    const body = await req.json();
    const price = Number(body.price || 0);
    const audience = Number(body.audience || 0);
    const conversion = Number(body.conversion || 0) / 100;
    const ticket = Number(body.ticket || 0);
    const days = Number(body.days || 1);

    const investment = price * days;
    const potentialClients = Math.round(audience * days * conversion);
    const revenue = potentialClients * ticket;
    const roi = investment === 0 ? null : ((revenue - investment) / investment) * 100;
    const breakEvenClients = investment === 0 ? null : Math.ceil(investment / (ticket || 1));

    const result = { investment, potentialClients, revenue, roi, breakEvenClients };

    await prisma.toolUsage.create({ data: { userId: user.id, toolName: 'roi-calculator', inputData: body, outputData: result } }).catch(()=>{});

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error('ROI error', err);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
// creado por pato dev y askforvini
