import type { Metadata } from "next";
import { KosherShell } from "@/components/kosher/KosherShell";
import { KosherViewerProvider, type ClientViewer } from "@/components/kosher/KosherViewer";
import { getKosherViewer } from "@/lib/kosher/server";
import { remindExpiringCertificates } from "@/lib/kosher/notify";

export const metadata: Metadata = {
  title: { default: "Mercav Kosher", template: "%s · Mercav Kosher" },
  description:
    "El atlas comunitario de lugares kosher, sinagogas y kehilot de Mercav. Mapa, valoraciones, stock por sucursal y conversación de tu comunidad.",
};

export const dynamic = "force-dynamic";

export default async function KosherLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getKosherViewer();
  if (viewer) await remindExpiringCertificates(viewer.id).catch(() => undefined);
  const value: ClientViewer = {
    signedIn: !!viewer,
    name: viewer?.name ?? null,
    isModerator: viewer?.isModerator ?? false,
    shabbatLocked: viewer?.shabbatLocked ?? false,
    city: viewer?.profile?.city ?? null,
    lat: viewer?.profile?.lat ?? null,
    lng: viewer?.profile?.lng ?? null,
    shabbatMode: viewer?.profile?.shabbatMode ?? false,
    denomination: viewer?.profile?.denomination ?? null,
    orthodoxStream: viewer?.profile?.orthodoxStream ?? null,
  };

  return (
    <KosherViewerProvider value={value}>
      <KosherShell>{children}</KosherShell>
    </KosherViewerProvider>
  );
}
