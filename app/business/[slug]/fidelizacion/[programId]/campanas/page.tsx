import type { Metadata } from "next";
import { ProgramFrame } from "@/components/business/loyalty/panel/ProgramFrame";
import { CampaignsPanel } from "@/components/business/loyalty/panel/CampaignsPanel";
import { latamCountry, todayIn } from "@/lib/geo/latam";
import { listCampaigns } from "@/lib/business/loyalty/stats";
import { DAY_MS } from "@/lib/business/loyalty/stats-core";
import { panelProgram } from "../../_lib/program";

export const metadata: Metadata = { title: "Campañas · Fidelización" };
export const dynamic = "force-dynamic";

export default async function ProgramCampaignsPage({ params }: { params: { slug: string; programId: string } }) {
  const { ctx, view } = await panelProgram(params.slug, params.programId, "loyalty.view");
  const { workspace } = ctx;
  const timeZone = latamCountry(workspace.country).timezone;
  const now = new Date();
  const campaigns = await listCampaigns(view.id);
  return (
    <ProgramFrame slug={workspace.slug} program={view} workspaceName={workspace.name} active="campanas" canManage={ctx.can("loyalty.manage")}>
      <CampaignsPanel
        slug={workspace.slug}
        programId={view.id}
        status={view.status}
        canManage={ctx.can("loyalty.manage")}
        tiers={view.rules.tiers.map((t) => t.name)}
        initialCampaigns={campaigns}
        timeZone={timeZone}
        today={todayIn(timeZone, now)}
        maxDay={todayIn(timeZone, new Date(now.getTime() + 365 * DAY_MS))}
      />
    </ProgramFrame>
  );
}
// creado por pato dev y askforvini
