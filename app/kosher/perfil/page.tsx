import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getKosherViewer } from "@/lib/kosher/server";
import { nextShabbat } from "@/lib/kosher/zmanim";
import { listCities } from "@/lib/kosher/cities";
import { ALERT_TOPICS } from "@/lib/kosher/notify";
import { AlertsForm } from "@/components/kosher/CommunityForms";
import { KosherProfileForm } from "@/components/kosher/KosherProfileForm";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function KosherProfilePage() {
  const [viewer, cities] = await Promise.all([getKosherViewer(), listCities()]);
  const communities = cities.map((c) => ({ ...c, ...nextShabbat(c) }));
  const alerts = viewer ? await prisma.kosherAlert.findMany({ where: { userId: viewer.id }, select: { city: true, countryCode: true, topics: true } }) : [];

  if (!viewer) {
    return (
      <div className="mx-auto max-w-xl rounded-[2rem] border border-border bg-bg-secondary p-10 text-center">
        <h1 className="font-display text-3xl font-semibold text-[var(--text-primary)]">Tu perfil Kosher</h1>
        <p className="mt-3 text-[var(--text-secondary)]">Usá tu cuenta Mercav para guardar tu ciudad, tu corriente y el modo Shabat.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/login?callbackUrl=/kosher/perfil" className="inline-flex h-12 items-center rounded-full bg-gold px-7 text-sm font-semibold text-black">Iniciar sesión</Link>
          <Link href="/register" className="inline-flex h-12 items-center rounded-full border border-border px-7 text-sm font-semibold text-[var(--text-primary)]">Crear cuenta</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8">
        <p className="text-sm text-[var(--text-tertiary)]">Shalom, {viewer.name.split(" ")[0]}</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-[var(--text-primary)] md:text-5xl">Tu perfil Kosher</h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          Es tu misma cuenta Mercav. Estas preferencias solo se usan dentro de Mercav Kosher.
        </p>
      </header>
      <KosherProfileForm
        communities={communities}
        initial={{
          city: viewer.profile?.city ?? null,
          countryCode: viewer.profile?.countryCode ?? null,
          lat: viewer.profile?.lat ?? null,
          lng: viewer.profile?.lng ?? null,
          timezone: viewer.profile?.timezone ?? null,
          shabbatMode: viewer.profile?.shabbatMode ?? false,
          denomination: viewer.profile?.denomination ?? null,
          orthodoxStream: viewer.profile?.orthodoxStream ?? null,
        }}
        role={viewer.isAdmin ? "Administrador" : viewer.profile?.role === "local_moderator" ? "Moderador local" : viewer.profile?.role === "agency" ? "Agencia" : "Miembro"}
      />
      <AlertsForm
        cities={cities.map((c) => ({ slug: c.slug, city: c.city, countryCode: c.countryCode }))}
        topics={ALERT_TOPICS}
        initial={alerts}
      />
    </div>
  );
}
