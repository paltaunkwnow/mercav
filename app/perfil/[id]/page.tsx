import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, MessageSquare, ShieldCheck, ArrowLeft, Mail, Crown, Settings, CalendarDays } from "@/components/icons";
import { Container, buttonClass } from "@/components/site/primitives";

import { FollowButton } from "@/components/ui/FollowButton";
import { LinkIcon } from "@/components/icons";

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
      // SEGURIDAD: `user` se pasa a <ProfileTabs> (componente cliente) y se serializa en el HTML.
      // Antes viajaban el hash de la contraseña, el secreto 2FA, el email, NIT/CI y datos de sanción.
      const {
        password: _password,
        twoFactorSecret: _twoFactorSecret,
        email: _email,
        nit: _nit,
        ci: _ci,
        sanctionReason: _sanctionReason,
        sanctionExpiresAt: _sanctionExpiresAt,
        ...publicUser
      } = user;
      user = publicUser;
      if (user.profile && !user.profile.salaryVisible) {
        user.profile = { ...user.profile, salaryMin: null, salaryMax: null };
      }
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
    // Visitantes no ven publicaciones desactivadas o en revisión de moderación
    where: isOwnProfile ? { authorId: user.id } : { authorId: user.id, isActive: true, isUnderReview: false },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      _count: { select: { comments: true, likes: true } }
    }
  });

  const isAdmin = user.roles?.some((r: any) => r.role === "ADMIN") || user.username === "ice";
  const isCeo = user.profile?.headline?.toUpperCase().includes("CEO") || user.username === "ice";
  const isCompany = user.profile?.profileType === "EMPRESA";

  return (
    <div className="relative w-full overflow-hidden bg-bg-primary pb-16 pt-24 md:pb-24 md:pt-28">
      <div className="mv-aura" aria-hidden />
      <Container className="relative max-w-[64rem]">
        <Link href="/" className="mv-focus mb-5 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Volver al inicio
        </Link>

        {/* Profile header */}
        <section aria-labelledby="perfil-nombre" className="mv-panel mb-10 overflow-hidden md:mb-12">
          <div className="relative h-40 w-full bg-bg-tertiary sm:h-56">
            {user.coverImage ? (
              <img src={user.coverImage} className="h-full w-full object-cover" alt="" />
            ) : (
              <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(212,175,55,0.22),transparent_60%),linear-gradient(135deg,var(--color-bg-tertiary),var(--color-bg-primary))]" />
            )}
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />
            {isCompany && (
              <span className="mv-menu absolute right-4 top-4 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)]">
                Cuenta de empresa
              </span>
            )}
          </div>

          <div className="px-5 pb-6 sm:px-8 sm:pb-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="relative -mt-14 h-28 w-28 shrink-0 overflow-hidden rounded-[1.75rem] border-4 border-bg-secondary bg-bg-tertiary shadow-2xl sm:-mt-16 sm:h-32 sm:w-32">
                {user.avatar ? (
                  <img src={user.avatar} className="h-full w-full object-cover" alt={`Foto de ${user.name}`} />
                ) : (
                  <span className="grid h-full w-full place-items-center font-display text-5xl font-semibold text-gold/50" aria-hidden>
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
                {isOwnProfile ? (
                  <Link href="/perfil/editar" className={buttonClass("secondary", "md", "w-full sm:w-auto")}>
                    <Settings className="h-4 w-4" aria-hidden /> Editar perfil
                  </Link>
                ) : (
                  <>
                    <Link href={`/mensajes?to=${user.id}`} className={buttonClass("primary", "md", "w-full sm:w-auto")}>
                      <MessageSquare className="h-4 w-4" aria-hidden /> Enviar mensaje
                    </Link>
                    <FollowButton userId={user.id} username={user.username || user.id} initialFollowed={isFollowing} />
                  </>
                )}
              </div>
            </div>

            <div className="mt-5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 id="perfil-nombre" className="mv-h2 text-[2rem] sm:text-[2.5rem]">{user.name}</h1>
                <ul className="flex items-center gap-1.5" aria-label="Insignias">
                  {user.isVerified && (
                    <ProfileBadge label={isAdmin ? "Administrador" : "Verificado"}>
                      <ShieldCheck className={`h-6 w-6 ${isAdmin ? "text-gold" : "text-blue-400"}`} aria-hidden />
                    </ProfileBadge>
                  )}
                  {isCeo && (
                    <ProfileBadge label="CEO">
                      <Crown className="h-6 w-6 text-gold" aria-hidden />
                    </ProfileBadge>
                  )}
                  {user.badges?.map((badge: any) => (
                    <ProfileBadge key={badge.id} label={badge.name}>
                      <img src={badge.icon} alt="" className="h-7 w-7 object-contain" loading="lazy" decoding="async" />
                    </ProfileBadge>
                  ))}
                </ul>
              </div>
              {user.profile?.headline && (
                <p className="mt-2 text-lg font-medium text-[var(--text-primary)]">{user.profile.headline}</p>
              )}
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--text-secondary)]">
                <span className="mv-data text-gold">@{user.username || user.id.slice(0,8)}</span>
                <span aria-hidden className="text-[var(--text-tertiary)]">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" aria-hidden /> Miembro desde <span className="mv-data">{joinYear}</span>
                </span>
              </p>

              {user.bio && <p className="mv-body mt-5 max-w-3xl whitespace-pre-line text-base">{user.bio}</p>}

              {(user.location || user.profile?.publicEmail || user.profile?.website) && (
                <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2.5 border-t border-[var(--mv-hairline)] pt-5 text-sm text-[var(--text-secondary)]">
                  {user.location && (
                    <li className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gold" aria-hidden /> {user.location}
                    </li>
                  )}
                  {user.profile?.publicEmail && (
                    <li className="flex min-w-0 items-center gap-2">
                      <Mail className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                      <a href={`mailto:${user.profile.publicEmail}`} className="mv-focus truncate rounded transition-colors hover:text-[var(--text-primary)]">{user.profile.publicEmail}</a>
                    </li>
                  )}
                  {user.profile?.website && (
                    <li className="flex min-w-0 items-center gap-2">
                      <LinkIcon className="h-4 w-4 shrink-0 text-gold" aria-hidden />
                      <a href={user.profile.website} target="_blank" rel="noopener noreferrer" className="mv-focus truncate rounded transition-colors hover:text-[var(--text-primary)]">{user.profile.website.replace(/^https?:\/\//, '')}</a>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* Main Content Area with Tabs */}
        <ProfileTabs user={user} posts={posts} />
      </Container>
    </div>
  );
}

function ProfileBadge({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="group relative grid h-9 w-9 place-items-center">
      <span tabIndex={0} className="mv-focus grid h-9 w-9 place-items-center rounded-full" aria-label={label}>
        {children}
      </span>
      <span
        role="tooltip"
        className="mv-menu pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-semibold text-[var(--text-primary)] opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
      >
        {label}
      </span>
    </li>
  );
}
// creado por pato dev y askforvini
