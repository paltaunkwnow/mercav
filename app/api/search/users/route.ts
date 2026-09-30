import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const take = Number(searchParams.get('take') || 10);
    const page = Number(searchParams.get('page') || 1);
    const skip = (page - 1) * take;

    const users = await prisma.user.findMany({ where: { OR: [ { name: { contains: q, mode: 'insensitive' } }, { username: { contains: q, mode: 'insensitive' } }, { profile: { headline: { contains: q, mode: 'insensitive' } } } ] }, take, skip, select: { id:true, name:true, username:true, avatar:true, profile: { select: { headline:true } } } });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Search users error', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
// creado por pato dev y askforvini
