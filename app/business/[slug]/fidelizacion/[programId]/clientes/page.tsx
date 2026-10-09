import type { Metadata } from "next";
import { ProgramFrame } from "@/components/business/loyalty/panel/ProgramFrame";
import { CustomersPanel } from "@/components/business/loyalty/panel/CustomersPanel";
import { parseCardFilter } from "@/lib/business/loyalty/stats-core";
import { panelProgram } from "../../_lib/program";

export const metadata: Metadata = { title: "Clientes · Fidelización" };
export const dynamic = "force-dynamic";

export default async function ProgramCustomersPage({
  params,
  searchParams,
}: {
  params: { slug: string; programId: string };
  searchParams: { filtro?: string; tarjeta?: string };
}) {
  const { ctx, view } = await panelProgram(params.slug, params.programId, "loyalty.view");
  const { workspace } = ctx;
  const cardId = typeof searchParams.tarjeta === "string" && /^[a-z0-9]{10,40}$/i.test(searchParams.tarjeta) ? searchParams.tarjeta : null;
  return (
    <ProgramFrame slug={workspace.slug} program={view} workspaceName={workspace.name} active="clientes" canManage={ctx.can("loyalty.manage")}>
      <CustomersPanel
        slug={workspace.slug}
        programId={view.id}
        type={view.type}
        canManage={ctx.can("loyalty.manage")}
        initialFilter={parseCardFilter(searchParams.filtro)}
        initialCardId={cardId}
        emptyHref={`/business/${workspace.slug}/fidelizacion/${view.id}/cartel`}
      />
    </ProgramFrame>
  );
}
// creado por pato dev y askforvini
