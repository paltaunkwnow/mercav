import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    // Automatically deactivate expired job posts
    try {
      await prisma.jobPost.updateMany({
        where: {
          isActive: true,
          expiresAt: { lt: new Date() }
        },
        data: {
          isActive: false
        }
      });
    } catch (e) {
      console.error("Auto deactivating expired jobs error", e);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!me) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const module = searchParams.get("module") || "ALL";
    const take = Number(searchParams.get("take") || 10);

    const followingIds = await prisma.follow.findMany({
      where: { followerId: me.id },
      select: { followingId: true }
    });
    const followedUserIds = followingIds.map((f) => f.followingId);

    const orConditions = [
      followedUserIds.length > 0 ? { authorId: { in: followedUserIds } } : undefined,
      me.location ? { author: { location: { contains: me.location, mode: "insensitive" } } } : undefined,
      me.country ? { author: { country: { contains: me.country, mode: "insensitive" } } } : undefined,
    ].filter(Boolean);

    const feedWhere: any = {
      ...(module !== "ALL" ? { module } : {}),
      ...(orConditions.length > 0 ? { OR: orConditions } : {}),
      isActive: true,
      isUnderReview: false,
    };

    console.log("FEED REQUEST:", { module, cursor, userId: me.id });
    
    const posts = await prisma.post.findMany({
      where: feedWhere,
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, username: true, avatar: true, bio: true, location: true, country: true, isVerified: true, badges: true, profile: { select: { headline: true, profileType: true } } } },
        likes: { select: { type: true, userId: true } },
        _count: { select: { comments: true, likes: true } },
        job: { select: { id: true, title: true, city: true, country: true, salaryMin: true, salaryMax: true, salaryCurrency: true, company: { select: { id: true, name: true, avatar: true, isVerified: true } } } },
        service: { select: { id: true, title: true, provider: { select: { id: true, name: true, avatar: true, isVerified: true } }, packages: { take: 1, orderBy: { price: "asc" }, select: { price: true } } } },
        space: { select: { id: true, title: true, city: true, country: true, pricePerDay: true, currency: true, images: { take: 1, orderBy: { order: "asc" }, select: { url: true } } } },
        comments: { take: 2, orderBy: { createdAt: "desc" }, select: { id: true, author: { select: { id: true, avatar: true } } } }
      }
    });

    const nextCursor = posts.length > take ? posts[take].id : null;
    const items = posts.slice(0, take).map((post) => {
      const myReaction = post.likes.find((like) => like.userId === me.id);
      return {
        ...post,
        likedByMe: !!myReaction,
        myReactionType: myReaction?.type || null,
        reactions: post.likes.reduce((acc: Record<string, number>, like) => {
          acc[like.type] = (acc[like.type] || 0) + 1;
          return acc;
        }, {}),
      };
    });

    const suggestedUsers = await prisma.user.findMany({
      where: {
        id: { not: me.id, notIn: followedUserIds },
        OR: [
          me.location ? { location: { contains: me.location, mode: "insensitive" } } : undefined,
          me.country ? { country: { contains: me.country, mode: "insensitive" } } : undefined
        ].filter(Boolean)
      },
      take: 5,
      select: { id: true, name: true, username: true, avatar: true, bio: true, location: true, badges: true, profile: { select: { headline: true } } }
    });

    const recommendedJobs = await prisma.jobPost.findMany({
      where: {
        isActive: true,
        isUnderReview: false,
        OR: [
          me.location ? { city: { contains: me.location, mode: "insensitive" } } : undefined,
          me.country ? { country: { contains: me.country, mode: "insensitive" } } : undefined,
        ].filter(Boolean)
      },
      take: 5,
      include: { company: { select: { id: true, name: true, avatar: true, isVerified: true } } }
    });

    const featuredSpaces = await prisma.space.findMany({
      where: {
        isActive: true,
        isUnderReview: false,
        OR: [
          me.location ? { city: { contains: me.location, mode: "insensitive" } } : undefined,
          me.country ? { country: { contains: me.country, mode: "insensitive" } } : undefined,
        ].filter(Boolean)
      },
      take: 5,
      include: { images: { take: 1, orderBy: { order: "asc" } }, owner: { select: { id: true, name: true, avatar: true, isVerified: true } } }
    });

    return NextResponse.json({
      success: true,
      data: {
        posts: items,
        nextCursor,
        suggestedUsers,
        recommendedJobs,
        featuredSpaces,
        user: {
          id: me.id,
          name: me.name,
          username: me.username,
          avatar: me.avatar,
          location: me.location,
          country: me.country,
          profileCompleteness: me.profileCompleteness,
          plan: me.plan,
          badges: await prisma.badge.findMany({ where: { users: { some: { id: me.id } } } })
        }
      }
    });
  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json({ success: false, error: (error as any).message }, { status: 500 });
  }
}
