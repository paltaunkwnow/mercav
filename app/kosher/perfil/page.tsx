import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getKosherViewer } from "@/lib/kosher/server";
import { nextShabbat } from "@/lib/kosher/zmanim";
import { listCities } from "@/lib/kosher/cities";
import { ALERT_TOPICS } from "@/lib/kosher/notify";
import { AlertsForm } from "@/components/kosher/CommunityForms";
import { KosherProfileForm } from "@/components/kosher/KosherProfileForm";
import { PageIntro, SignInCard } from "@/components/kosher/ui";

export const metadata: Metadata = { title: "Mi perfil" };

export default async function KosherProfilePage() {
  const [viewer, cities] = await Promise.all([getKosherViewer(), listCities()]);
  const communities = cities.map((c) => ({ ...c, ...nextShabbat(c) }));
  const alerts = viewer ? await prisma.kosherAlert.findMany({ where: { userId: viewer.id }, select: { city: true, countryCode: true, topics: true } }) : [];

  if (!viewer) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageIntro eyebrow="Mi perfil" title="Tu perfil Kosher">
          <p>Guardá tu ciudad, tu corriente y el modo Shabat. Es tu misma cuenta Mercav, sin otro registro.</p>
        </PageIntro>
        <SignInCard callbackUrl="/kosher/perfil">Iniciá sesión para guardar tus preferencias y recibir alertas de tu ciudad.</SignInCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageIntro eyebrow={`Shalom, ${viewer.name.split(" ")[0]}`} title="Tu perfil Kosher">
        <p>Es tu misma cuenta Mercav. Estas preferencias solo se usan dentro de Mercav Kosher.</p>
      </PageIntro>
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
