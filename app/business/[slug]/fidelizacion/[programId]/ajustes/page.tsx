import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProgramFrame } from "@/components/business/loyalty/panel/ProgramFrame";
import { ProgramSettings } from "@/components/business/loyalty/panel/ProgramSettings";
import { panelProgram } from "../../_lib/program";

export const metadata: Metadata = { title: "Ajustes · Fidelización" };
export const dynamic = "force-dynamic";

export default async function ProgramSettingsPage({ params }: { params: { slug: string; programId: string } }) {
  const { ctx, view } = await panelProgram(params.slug, params.programId, "loyalty.manage");
  const { workspace } = ctx;
  const cardsCount = await prisma.loyaltyCard.count({ where: { programId: view.id } });
  return (
    <ProgramFrame slug={workspace.slug} program={view} workspaceName={workspace.name} active="ajustes" canManage>
      <ProgramSettings
        key={view.id}
        slug={workspace.slug}
        program={view}
        cardsCount={cardsCount}
        workspaceName={workspace.name}
        country={workspace.country}
        currency={workspace.currency}
      />
    </ProgramFrame>
  );
}
// creado por pato dev y askforvini
