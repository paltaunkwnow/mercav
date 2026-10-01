import type { Metadata } from "next";
import { KosherShell } from "@/components/kosher/KosherShell";
import { KOSHER_URL } from "@/lib/seo/site";
import { KosherViewerProvider, type ClientViewer } from "@/components/kosher/KosherViewer";
import { getKosherViewer } from "@/lib/kosher/server";
import { remindExpiringCertificates } from "@/lib/kosher/notify";

export const metadata: Metadata = {
  metadataBase: new URL(KOSHER_URL),
  title: { absolute: "Mercav Kosher — dónde hay kosher en cada ciudad de Latinoamérica", template: "%s · Mercav Kosher" },
  description:
    "El atlas comunitario de lugares kosher, sinagogas y kehilot de Mercav. Mapa, valoraciones, stock por sucursal, horarios de Shabat y la conversación de tu comunidad. Mercav Kosher no emite hechsher.",
  keywords: ["kosher", "comida kosher", "restaurantes kosher", "sinagogas", "kehilá", "Shabat", "Buenos Aires", "São Paulo", "La Paz", "Montevideo", "Santiago"],
  openGraph: { type: "website", locale: "es_419", siteName: "Mercav Kosher", url: KOSHER_URL, title: "Mercav Kosher — dónde hay kosher, en cada ciudad" },
  twitter: { card: "summary_large_image", title: "Mercav Kosher — dónde hay kosher, en cada ciudad" },
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
