import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/business/context";
import { programInclude, programView } from "@/lib/business/loyalty/service";
import { AppPage } from "@/components/app-shell/AppPage";
import { BusinessTabs, Empty } from "@/components/business/ui";
import { StampStation } from "@/components/business/loyalty/staff/StampStation";

export const metadata: Metadata = { title: "Sellar", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Caja: escanear la tarjeta del cliente y sumar sellos o puntos, o canjear premios. */
export default async function SellarPage({ params, searchParams }: { params: { slug: string }; searchParams: Record<string, string | string[] | undefined> }) {
  const ctx = await requireBusiness(params.slug, "loyalty.stamp");
  const { workspace, role } = ctx;
  const rows = await prisma.loyaltyProgram.findMany({
    where: { workspaceId: workspace.id, status: "ACTIVE" },
    include: programInclude,
    orderBy: { createdAt: "asc" },
  });
  const programs = rows.map(programView);
  const raw = Array.isArray(searchParams.card) ? searchParams.card[0] : searchParams.card;
  const initialCode = raw && /^[A-Za-z2-7]{24}$/.test(raw) ? raw.toUpperCase() : null;

  return (
    <AppPage kicker={workspace.name} title="Sellar" tabs={<BusinessTabs slug={workspace.slug} role={role} active="sellar" />}>
      {programs.length ? (
        <StampStation slug={workspace.slug} programs={programs} initialCode={initialCode} />
      ) : (
        <div className="mx-auto w-full max-w-xl">
          <Empty
            title="Todavía no hay un club activo"
            action={
              ctx.can("loyalty.view") ? (
                <Link href={`/business/${workspace.slug}/fidelizacion`} className="mv-btn mv-btn-primary">
                  Ir a Fidelización
                </Link>
              ) : null
            }
          >
            {ctx.can("loyalty.manage")
              ? "Creá o activá un club de fidelización y vas a poder sumar sellos y puntos desde acá."
              : "Cuando el negocio active su club de fidelización, vas a poder sumar sellos y puntos desde acá."}
          </Empty>
        </div>
      )}
    </AppPage>
  );
}
// creado por pato dev y askforvini
