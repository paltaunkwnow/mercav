import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FeedClient } from "@/components/feed/FeedClient";
import Link from "next/link";

export default async function FeedPage() {
  const session = await getServerSession(authOptions);
  
  // If not authenticated, show a teaser page
  if (!session?.user?.email) {
    return (
      <div className="min-h-screen bg-bg-primary pt-24 pb-20">
        <div className="container mx-auto max-w-2xl px-4 text-center">
          <div className="py-20">
            <div className="h-20 w-20 rounded-2xl bg-gold/10 flex items-center justify-center mx-auto mb-8">
              <svg className="h-10 w-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 font-display">Feed Mercav</h1>
            <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto">
              Descubre publicaciones de la comunidad, oportunidades de empleo, servicios profesionales y más. Todo en un solo lugar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login" className="inline-flex items-center justify-center bg-gold text-black px-8 py-3 rounded-xl font-semibold hover:bg-gold-light transition-all">
                Iniciar Sesión
              </Link>
              <Link href="/register" className="inline-flex items-center justify-center border border-gold/40 text-gold px-8 py-3 rounded-xl font-medium hover:bg-gold/10 transition-all">
                Crear Cuenta Gratis
              </Link>
            </div>
          </div>
        </div>
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
    <div className="min-h-screen bg-bg-primary pt-24 pb-20">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Feed Mercav</h1>
            <p className="mt-1 text-sm text-gray-400">Publicaciones de tus contactos, sugerencias por ubicación y contenido del mercado.</p>
          </div>
        </div>
        <FeedClient currentUser={user} />
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
