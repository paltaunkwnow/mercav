import type { Metadata } from "next";
import { requireBusiness } from "@/lib/business/context";
import { posDefaults, posSections } from "@/lib/business/pos";
import { PosWorkspaceScope } from "@/components/pos/PosWorkspaceScope";
import ConfigScreen from "@/components/pos/screens/ConfigScreen";

export const metadata: Metadata = { title: "Configuración · Caja", robots: { index: false, follow: false } };

/** Configuración de la caja. Sin caja todavía, es el alta: arranca con los datos de la empresa. */
export default async function Page({ params }: { params: { slug: string } }) {
  const ctx = await requireBusiness(params.slug, "pos.configure");
  return (
    <PosWorkspaceScope slug={ctx.workspace.slug} allowed={posSections(ctx)}>
      <ConfigScreen defaults={posDefaults(ctx)} />
    </PosWorkspaceScope>
  );
}
// creado por pato dev y askforvini
