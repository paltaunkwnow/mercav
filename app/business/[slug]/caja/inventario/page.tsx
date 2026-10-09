import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/business/context";
import { posSections, workspacePos } from "@/lib/business/pos";
import { PosWorkspaceScope } from "@/components/pos/PosWorkspaceScope";
import InventoryScreen from "@/components/pos/screens/InventoryScreen";

export const metadata: Metadata = { title: "Inventario · Caja", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: { slug: string } }) {
  const ctx = await requireBusiness(params.slug, "pos.inventory");
  if (!(await workspacePos(ctx.workspace.id))) redirect(`/business/${ctx.workspace.slug}/caja`);
  return (
    <PosWorkspaceScope slug={ctx.workspace.slug} allowed={posSections(ctx)}>
      <InventoryScreen />
    </PosWorkspaceScope>
  );
}
// creado por pato dev y askforvini
