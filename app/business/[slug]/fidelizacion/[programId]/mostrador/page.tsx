import type { Metadata } from "next";
import { KioskScreen } from "@/components/business/loyalty/panel/KioskScreen";
import { panelProgram } from "../../_lib/program";

export const metadata: Metadata = { title: "Mostrador" };
export const dynamic = "force-dynamic";

/** Pantalla de autoservicio para la tablet del mostrador. La opera el equipo (permiso de sellar). */
export default async function KioskPage({ params }: { params: { slug: string; programId: string } }) {
  const { ctx, view } = await panelProgram(params.slug, params.programId, "loyalty.stamp");
  const { workspace } = ctx;
  const problem =
    view.status !== "ACTIVE"
      ? "El programa no está activo. Activalo para usar el autoservicio."
      : view.type !== "STAMPS" || !view.rules.selfService
        ? "El autoservicio está apagado. Prendelo en Ajustes, en Extras."
        : null;
  const exitHref = ctx.can("loyalty.view") ? `/business/${workspace.slug}/fidelizacion/${view.id}/cartel` : `/business/${workspace.slug}/sellar`;
  return (
    <KioskScreen
      slug={workspace.slug}
      programId={view.id}
      programSlug={view.slug}
      businessName={view.design.displayName}
      design={view.design}
      exitHref={exitHref}
      initialProblem={problem}
    />
  );
}
// creado por pato dev y askforvini
