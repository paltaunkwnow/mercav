import { Shield, ChevronRight, Pencil, MapPin, Globe2, Briefcase, KeyRound, BadgeCheck, ArrowUpRight, CreditCard, Sparkles } from "@/components/icons";
import Link from "next/link";
import { Container, buttonClass } from "@/components/site/primitives";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { ThemeChoice } from "./ThemeChoice";

export const dynamic = 'force-dynamic';

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login?callbackUrl=/perfil");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true }
  });

  if (!user) {
    redirect("/login");
  }

  const isAdmin = user.username === "admin";
  const profileType = user.profile?.profileType === "EMPRESA" || user.profile?.profileType === "COMPANY" ? "Empresa" : "Profesional";
  const publicHref = `/perfil/${user.username || user.id}`;

  const accountLinks = [
    { icon: KeyRound, label: "Seguridad y 2FA", desc: "Verificación en dos pasos para iniciar sesión", href: "/perfil/editar#security" },
    { icon: Briefcase, label: "Mis publicaciones", desc: "Tus anuncios, servicios y vacantes", href: "/inicio#actividad" },
    { icon: CreditCard, label: "Mis tarjetas", desc: "Tus tarjetas de cliente y tu código MercavClub", href: "/perfil/tarjetas" },
    { icon: Sparkles, label: "Plan y pagos", desc: "Tu plan y cómo pasar a otro", href: "/precios" },
    { icon: Shield, label: "Privacidad", desc: "Cómo tratamos tus datos en Mercav", href: "/privacidad" },
  ];

  return (
    <div className="w-full pb-32 pt-24 sm:pt-28 md:pb-20 md:pt-32">
      <Container className="max-w-[60rem]">
        {/* Profile header */}
        <section aria-label="Mi perfil" className="mv-panel overflow-hidden">
          <div className="relative h-36 w-full bg-bg-tertiary sm:h-48">
            {user.coverImage ? (
              <img src={user.coverImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(212,175,55,0.22),transparent_60%),linear-gradient(135deg,var(--color-bg-tertiary),var(--color-bg-primary))]" />
            )}
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
          </div>

          <div className="px-5 pb-6 sm:px-8 sm:pb-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="relative -mt-12 h-24 w-24 shrink-0 overflow-hidden rounded-[1.5rem] border-4 border-bg-secondary bg-bg-tertiary shadow-xl sm:-mt-14 sm:h-28 sm:w-28">
                {user.avatar ? (
                  <img src={user.avatar} alt={`Foto de ${user.name}`} className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center font-display text-4xl font-semibold text-gold/60" aria-hidden>
                    {(user.name || "?").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Link href="/perfil/editar" className={buttonClass("primary", "md", "w-full sm:w-auto")}>
                  <Pencil className="h-4 w-4" aria-hidden /> Editar perfil
                </Link>
                <Link href={publicHref} className={buttonClass("secondary", "md", "w-full sm:w-auto")}>
                  Ver perfil público <ArrowUpRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="mv-h3 text-2xl sm:text-[1.75rem]">{user.name}</h1>
                {user.isVerified && (
                  isAdmin ? (
                    <span className="mv-chip mv-chip-gold">Administrador</span>
                  ) : (
                    <span className="mv-chip text-blue-400"><BadgeCheck className="h-3.5 w-3.5" aria-hidden /> Verificado</span>
                  )
                )}
              </div>
              <p className="mv-data mt-1 text-sm text-[var(--text-secondary)]">@{user.username || "usuario"}</p>
              {user.profile?.headline && <p className="mt-3 text-base font-medium text-[var(--text-primary)]">{user.profile.headline}</p>}
              {user.bio && <p className="mv-body mt-2 max-w-2xl">{user.bio}</p>}

              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--text-secondary)]">
                {user.location && (
                  <li className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-gold" aria-hidden /> {user.location}
                  </li>
                )}
                <li className="flex items-center gap-1.5">
                  <Globe2 className="h-4 w-4 text-gold" aria-hidden /> {profileType}
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Account */}
        <section aria-labelledby="perfil-cuenta" className="mt-10">
          <h2 id="perfil-cuenta" className="mv-h3">Tu cuenta</h2>
          <p className="mv-body mt-1">Todo lo que configurás acá se aplica a cada módulo de Mercav.</p>
          <ul className="mv-panel mt-5 overflow-hidden p-1.5">
            {accountLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="mv-focus group flex items-center gap-4 rounded-[1.1rem] p-3.5 transition-colors duration-200 hover:bg-[var(--mv-panel-hover)] sm:p-4"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-[var(--text-secondary)] transition-colors duration-200 group-hover:text-gold">
                    <item.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-[var(--text-primary)]">{item.label}</span>
                    <span className="block truncate text-sm text-[var(--text-secondary)]">{item.desc}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-[var(--text-tertiary)] transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Appearance */}
        <section aria-labelledby="perfil-apariencia" className="mt-10">
          <h2 id="perfil-apariencia" className="mv-h3">Apariencia</h2>
          <ThemeChoice labelledBy="perfil-apariencia" />
        </section>

        {/* Session */}
        <section aria-labelledby="perfil-sesion" className="mt-10 flex flex-col gap-4 rounded-[1.5rem] border border-red-500/20 bg-red-500/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 id="perfil-sesion" className="font-semibold text-[var(--text-primary)]">Sesión</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Cerrá la sesión en este dispositivo.</p>
          </div>
          <LogoutButton />
        </section>
      </Container>
    </div>
  );
}
// creado por pato dev y askforvini
