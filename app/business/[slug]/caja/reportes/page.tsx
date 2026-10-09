import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/business/context";
import { posSections, workspacePos } from "@/lib/business/pos";
import { PosWorkspaceScope } from "@/components/pos/PosWorkspaceScope";
import ReportsScreen from "@/components/pos/screens/ReportsScreen";

export const metadata: Metadata = { title: "Reportes de ventas · Caja", robots: { index: false, follow: false } };

export default async function Page({ params }: { params: { slug: string } }) {
  const ctx = await requireBusiness(params.slug, "pos.reports");
  if (!(await workspacePos(ctx.workspace.id))) redirect(`/business/${ctx.workspace.slug}/caja`);
  return (
    <PosWorkspaceScope slug={ctx.workspace.slug} allowed={posSections(ctx)}>
      <ReportsScreen />
    </PosWorkspaceScope>
  );
}
// creado por pato dev y askforvini
