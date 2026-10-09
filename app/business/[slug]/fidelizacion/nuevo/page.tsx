import type { Metadata } from "next";
import { requireBusiness } from "@/lib/business/context";
import { AppPage } from "@/components/app-shell/AppPage";
import { ProgramWizard } from "@/components/business/loyalty/panel/ProgramWizard";

export const metadata: Metadata = { title: "Nuevo programa" };
export const dynamic = "force-dynamic";

export default async function NewLoyaltyProgramPage({ params }: { params: { slug: string } }) {
  const ctx = await requireBusiness(params.slug, "loyalty.manage");
  const { workspace } = ctx;
  return (
    <AppPage
      kicker={`${workspace.name} · Fidelización`}
      title="Nuevo programa"
      lead="Cuatro pasos y listo. Podés cambiar todo después."
      back={{ href: `/business/${workspace.slug}/fidelizacion`, label: "Fidelización" }}
      width="wide"
    >
      <ProgramWizard slug={workspace.slug} workspaceName={workspace.name} country={workspace.country} currency={workspace.currency} />
    </AppPage>
  );
}
// creado por pato dev y askforvini
