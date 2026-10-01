import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().slice(0, 100);
    // Límites: antes `take` no tenía tope (take=1000000 volcaba todos los usuarios) y NaN daba 500
    const take = Math.min(20, Math.max(1, Number(searchParams.get('take') || 10) || 10));
    const page = Math.min(50, Math.max(1, Number(searchParams.get('page') || 1) || 1));
    const skip = (page - 1) * take;
    if (q.length < 2) return NextResponse.json({ success: true, data: [] });

    const users = await prisma.user.findMany({ where: { OR: [ { name: { contains: q, mode: 'insensitive' } }, { username: { contains: q, mode: 'insensitive' } }, { profile: { headline: { contains: q, mode: 'insensitive' } } } ] }, take, skip, select: { id:true, name:true, username:true, avatar:true, profile: { select: { headline:true } } } });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Search users error', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
// creado por pato dev y askforvini
