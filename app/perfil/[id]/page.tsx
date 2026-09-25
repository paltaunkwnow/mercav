import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Briefcase, Star, MessageSquare, CheckCircle, ShieldCheck, ArrowLeft, Mail, Crown, Settings, GraduationCap, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

import { FollowButton } from "@/components/ui/FollowButton";
import { LinkIcon } from "lucide-react";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ProfileTabs from "./ProfileTabs";

export default async function PerfilPublicoPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as any)?.id;
  
  let user: any = null;
  
  try {
    // Robust lookup by either username or ID
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: params.id },
          { id: params.id }
        ]
      },
      include: {
        roles: { select: { role: true } },
        profile: {
          include: {
            experiences: { orderBy: { startDate: 'desc' } },
            educations: { orderBy: { startYear: 'desc' } },
            skills: true,
            languages: true,
          }
        },
        services: {
          include: { packages: { take: 1, orderBy: { price: 'asc' } } },
          take: 6
        },
        spaces: {
          include: { images: { take: 1 } },
          take: 4
        },
        jobPosts: {
          take: 4
        },
        _count: {
          select: { services: true, spaces: true, jobPosts: true }
        },
        badges: true
      }
    });

    if (user) {
      user.stats = {
        services: user._count.services,
        spaces: user._count.spaces,
        rating: 5.0, // Mock rating
        reviews: 0
      };
    }
  } catch (e) {
    console.error("Error fetching user profile:", e);
  }

  if (!user) {
    notFound();
  }

  const isOwnProfile = currentUserId === user.id;

  // Check if current user follows this profile
  let isFollowing = false;
  if (currentUserId && !isOwnProfile) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: user.id
        }
      }
    });
    isFollowing = !!follow;
  }

  const joinYear = new Date(user.createdAt).getFullYear();
  const posts = user.id === "admin" ? [] : await prisma.post.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      _count: { select: { comments: true, likes: true } }
    }
  });

  return (
    <div className="w-full min-h-screen bg-bg-primary pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" asChild className="text-gray-400 hover:text-white -ml-4">
            <Link href="/"><ArrowLeft className="w-4 h-4 mr-2"/> Volver al inicio</Link>
          </Button>
        </div>

        {/* Profile Header */}
        <div className="bg-bg-secondary border border-border rounded-3xl overflow-hidden relative mb-12">
          {/* Cover Photo */}
          <div className="h-48 w-full bg-gradient-to-r from-bg-tertiary to-bg-primary relative border-b border-border">
            {user.coverImage ? (
              <img src={user.coverImage} className="w-full h-full object-cover" alt="Cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gold/20 via-transparent to-transparent" />
            )}
            {user.profile?.profileType === "EMPRESA" && (
              <div className="absolute top-4 right-4 bg-gold text-black text-[10px] font-black px-4 py-2 rounded-full z-20 uppercase tracking-widest shadow-2xl">
                Cuenta de Empresa
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-bg-secondary/90 via-transparent to-transparent" />
          </div>

          {/* Profile Info */}
          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end -mt-16 mb-8 gap-4">
              <div className="w-32 h-32 rounded-2xl border-4 border-bg-secondary bg-bg-tertiary overflow-hidden shadow-2xl relative z-10 flex items-center justify-center bg-gradient-to-br from-bg-tertiary to-bg-primary">
                {user.avatar ? (
                   <img src={user.avatar} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                   <span className="text-5xl font-black text-gold/30">{user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                {isOwnProfile ? (
                  <Button asChild className="flex-1 md:flex-none h-12 bg-white/5 text-white hover:bg-white/10 border border-white/10 font-black uppercase tracking-widest text-xs rounded-2xl transition-all">
                    <Link href="/perfil/editar"><Settings className="w-4 h-4 mr-2" /> Editar Perfil</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild className="flex-1 md:flex-none h-12 bg-gold text-black hover:bg-gold-light font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-gold/20">
                      <Link href={`/mensajes?to=${user.id}`}><MessageSquare className="w-4 h-4 mr-2" /> Mensaje Directo</Link>
                    </Button>
                    <FollowButton userId={user.id} username={user.username || user.id} initialFollowed={isFollowing} />
                  </>
                )}
              </div>
            </div>

            <div>
              <div className="flex flex-col mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-display font-black text-white tracking-tight">{user.name}</h1>
                  <div className="flex items-center gap-2">
                    {user.isVerified && (
                      (user.roles?.some((r: any) => r.role === "ADMIN") || user.username === "ice") ? (
                        <div className="group relative flex items-center justify-center">
                          <div className="h-8 w-8 md:h-9 md:w-9 flex items-center justify-center cursor-help transition-transform hover:scale-110">
                            <ShieldCheck className="w-full h-full text-gold filter drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
                          </div>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-[#0a0a0a] border border-gold/30 text-gold text-[10px] font-black uppercase tracking-[0.2em] rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-2xl scale-90 group-hover:scale-100 backdrop-blur-xl">
                            Administrador
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gold/30" />
                          </div>
                        </div>
                      ) : (
                        <ShieldCheck className="w-6 h-6 text-blue-400" />
                      )
                    )}

                    {(user.profile?.headline?.toUpperCase().includes("CEO") || user.username === "ice") && (
                      <div className="group relative flex items-center justify-center">
                        <div className="h-7 w-7 md:h-8 md:w-8 flex items-center justify-center cursor-help transition-transform hover:scale-110">
                          <Crown className="w-full h-full text-gold filter drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
                        </div>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-[#0a0a0a] border border-gold/30 text-gold text-[10px] font-black uppercase tracking-[0.2em] rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-2xl scale-90 group-hover:scale-100 backdrop-blur-xl">
                          CEO
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gold/30" />
                        </div>
                      </div>
                    )}
                    
                    {/* Dynamic Badges */}
                    {user.badges?.map((badge: any) => (
                      <div key={badge.id} className="group relative flex items-center justify-center">
                        <div className="h-8 w-8 md:h-9 md:w-9 flex items-center justify-center cursor-help transition-transform hover:scale-110">
                          <img src={badge.icon} alt={badge.name} className="max-w-full max-h-full object-contain filter drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)]" />
                        </div>
                        
                        {/* Tooltip on Hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-[#0a0a0a] border border-gold/30 text-gold text-[10px] font-black uppercase tracking-[0.2em] rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50 shadow-[0_10px_30px_rgba(0,0,0,0.5)] scale-90 group-hover:scale-100 backdrop-blur-xl">
                          {badge.name}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gold/30" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {user.profile?.headline && (
                  <p className="text-xl text-white font-medium mb-2 leading-tight">{user.profile.headline}</p>
                )}
                <div className="flex items-center gap-4">
                  <p className="text-gold font-mono font-bold">@{user.username || user.id.slice(0,8)}</p>
                  <span className="text-gray-700">•</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-black uppercase tracking-widest">
                    <CheckCircle className="w-3.5 h-3.5" /> Miembro desde {joinYear}
                  </div>
                </div>
              </div>
              
              {user.bio && (
                <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5 mb-8">
                  <p className="text-gray-400 leading-relaxed italic">
                    "{user.bio}"
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-xs text-gray-500 font-bold uppercase tracking-widest">
                {user.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gold" /> {user.location}
                  </div>
                )}
                {user.profile?.publicEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gold" /> 
                    <a href={`mailto:${user.profile.publicEmail}`} className="hover:text-white transition-colors">{user.profile.publicEmail}</a>
                  </div>
                )}
                {user.profile?.website && (
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-gold" /> 
                    <a href={user.profile.website} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{user.profile.website.replace(/^https?:\/\//, '')}</a>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-gold fill-gold" /> 
                  <span className="text-white font-black">{user.stats?.rating || "5.0"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area with Tabs */}
        <ProfileTabs user={user} posts={posts} />
      </div>
    </div>
  );
}
// creado por Patodev y Invertilo
