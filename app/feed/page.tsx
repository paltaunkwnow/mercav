import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FeedClient } from "@/components/feed/FeedClient";
import { Rss } from "@/components/icons";
import { ButtonLink, Container } from "@/components/site/primitives";

export default async function FeedPage() {
  const session = await getServerSession(authOptions);
  
  // If not authenticated, show a teaser page
  if (!session?.user?.email) {
    return (
      <div className="relative w-full overflow-hidden bg-bg-primary">
        <Container className="relative">
          <div className="mx-auto flex min-h-[80svh] max-w-2xl flex-col items-center justify-center pb-16 pt-32 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl border border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-gold">
              <Rss className="h-6 w-6" aria-hidden />
            </span>
            <h1 className="font-display text-[1.9rem] font-semibold leading-[1.05] tracking-tight text-[var(--text-primary)] sm:text-[2.4rem] mt-8">El feed de Mercav</h1>
            <p className="mv-lead mx-auto mt-5">
              Publicaciones de la comunidad, vacantes, servicios y espacios publicitarios, en un solo lugar.
            </p>
            <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <ButtonLink href="/register" size="lg" className="w-full sm:w-auto">Crear cuenta gratis</ButtonLink>
              <ButtonLink href="/login?callbackUrl=/feed" tone="secondary" size="lg" className="w-full sm:w-auto">Iniciar sesión</ButtonLink>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      spaces: { where: { isActive: true } },
      services: { where: { isActive: true } },
      jobPosts: { where: { isActive: true } },
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="relative w-full bg-bg-primary pb-32 pt-24 sm:pt-28 md:pb-20 md:pt-32">
      <Container width="wide">
        <header className="mb-6 md:mb-8">
          <h1 className="font-display text-[1.9rem] font-semibold leading-[1.05] tracking-tight text-[var(--text-primary)] sm:text-[2.4rem]">Feed</h1>
          <p className="mv-body mt-2 max-w-xl">Publicaciones de tus contactos, sugerencias por ubicación y novedades del mercado.</p>
        </header>
        <FeedClient currentUser={user} />
      </Container>
    </div>
  );
}
// creado por pato dev y askforvini
