import type { Metadata } from "next";
import { ProgramFrame } from "@/components/business/loyalty/panel/ProgramFrame";
import { CounterPanel } from "@/components/business/loyalty/panel/CounterPanel";
import { panelProgram } from "../../_lib/program";

export const metadata: Metadata = { title: "Mostrador · Fidelización" };
export const dynamic = "force-dynamic";

export default async function ProgramCounterPage({ params }: { params: { slug: string; programId: string } }) {
  const { ctx, view } = await panelProgram(params.slug, params.programId, "loyalty.view");
  const { workspace } = ctx;
  const main = view.rewards.find((r) => r.active) ?? null;
  return (
    <ProgramFrame slug={workspace.slug} program={view} workspaceName={workspace.name} active="mostrador" canManage={ctx.can("loyalty.manage")}>
      <CounterPanel
        slug={workspace.slug}
        programId={view.id}
        programSlug={view.slug}
        programName={view.name}
        status={view.status}
        type={view.type}
        design={view.design}
        stampsGoal={view.rules.stampsGoal}
        rewardName={main?.name ?? null}
        welcomeBonus={view.rules.welcomeBonus}
        selfService={view.rules.selfService}
        canManage={ctx.can("loyalty.manage")}
      />
    </ProgramFrame>
  );
}
// creado por pato dev y askforvini
