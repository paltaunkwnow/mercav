import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const tipo = searchParams.get('tipo') || 'all';
    const take = Math.min(12, Math.max(1, Number(searchParams.get('take') || 3) || 3));
    const page = Math.min(20, Math.max(1, Number(searchParams.get('page') || 1) || 1));
    const skip = (page - 1) * take;

    if (q.trim().length < 2) return NextResponse.json({ success: true, data: {} });

    if (tipo === 'users') {
      const users = await prisma.user.findMany({ where: { OR: [ { name: { contains: q, mode: 'insensitive' } }, { username: { contains: q, mode: 'insensitive' } }, { location: { contains: q, mode: 'insensitive' } } ] }, take, skip, select: { id:true, name:true, username:true, avatar:true, location:true, country:true, profile: { select: { headline:true, profileType:true } } } });
      return NextResponse.json({ success: true, data: { users } });
    }

    if (tipo === 'jobs') {
      const jobs = await prisma.jobPost.findMany({ where: { OR: [ { title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }, { city: { contains: q, mode: 'insensitive' } } ] }, take, skip, include: { company: { select: { id:true, name:true, avatar:true, isVerified:true } } } });
      return NextResponse.json({ success: true, data: { jobs } });
    }

    if (tipo === 'services') {
      const services = await prisma.service.findMany({ where: { OR: [ { title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }, { subcategory: { contains: q, mode: 'insensitive' } } ] }, take, skip, include: { provider: { select: { id:true, name:true, avatar:true, isVerified:true } }, packages: { take: 1, orderBy: { price: 'asc' } } } });
      return NextResponse.json({ success: true, data: { services } });
    }

    if (tipo === 'spaces') {
      const spaces = await prisma.space.findMany({ where: { OR: [ { title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }, { city: { contains: q, mode: 'insensitive' } } ] }, take, skip, include: { owner: { select: { id:true, name:true, avatar:true, isVerified:true } }, images: { take: 1, orderBy: { order: 'asc' } } } });
      return NextResponse.json({ success: true, data: { spaces } });
    }

    if (tipo === 'all' || tipo === 'people') {
      const users = await prisma.user.findMany({ where: { OR: [ { name: { contains: q, mode: 'insensitive' } }, { username: { contains: q, mode: 'insensitive' } }, { location: { contains: q, mode: 'insensitive' } } ] }, take: 3, select: { id:true, name:true, username:true, avatar:true, location:true, country:true, profile: { select: { headline:true, profileType:true } } } });
      const jobs = await prisma.jobPost.findMany({ where: { OR: [ { title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }, { city: { contains: q, mode: 'insensitive' } } ] }, take: 3, include: { company: { select: { id:true, name:true, avatar:true, isVerified:true } } } });
      const services = await prisma.service.findMany({ where: { OR: [ { title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }, { subcategory: { contains: q, mode: 'insensitive' } } ] }, take: 3, include: { provider: { select: { id:true, name:true, avatar:true, isVerified:true } }, packages: { take: 1, orderBy: { price: 'asc' } } } });
      const spaces = await prisma.space.findMany({ where: { OR: [ { title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }, { city: { contains: q, mode: 'insensitive' } } ] }, take: 3, include: { owner: { select: { id:true, name:true, avatar:true, isVerified:true } }, images: { take: 1, orderBy: { order: 'asc' } } } });

      return NextResponse.json({ success: true, data: { users, jobs, services, spaces } });
    }

    return NextResponse.json({ success: false, error: 'Tipo no soportado' }, { status: 400 });
  } catch (error) {
    console.error('Search error', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
// creado por pato dev y askforvini
