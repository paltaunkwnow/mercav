import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireBusiness } from "@/lib/business/context";
import { legacyPos, posLanding, posSections, workspacePos } from "@/lib/business/pos";
import { PosWorkspaceScope } from "@/components/pos/PosWorkspaceScope";
import { PosSetup } from "@/components/business/PosSetup";
import SaleScreen from "@/components/pos/screens/SaleScreen";

export const metadata: Metadata = { title: "Caja", robots: { index: false, follow: false } };

/** La caja de la empresa: vender. Si todavía no existe, el alta (o traer la caja de antes). */
export default async function BusinessCajaPage({ params }: { params: { slug: string } }) {
  const ctx = await requireBusiness(params.slug);
  const landing = posLanding(ctx);
  if (!landing) notFound();

  const pos = await workspacePos(ctx.workspace.id);
  if (!pos) {
    const legacy = ctx.role === "OWNER" ? await legacyPos(ctx.userId) : null;
    return (
      <PosSetup
        slug={ctx.workspace.slug}
        workspaceName={ctx.workspace.name}
        canConfigure={ctx.can("pos.configure")}
        legacy={legacy ? { shopName: legacy.shopName, products: legacy._count.products, sales: legacy._count.sales } : null}
      />
    );
  }
  if (!ctx.can("pos.sell")) redirect(landing);

  return (
    <PosWorkspaceScope slug={ctx.workspace.slug} allowed={posSections(ctx)}>
      <SaleScreen />
    </PosWorkspaceScope>
  );
}
// creado por pato dev y askforvini
