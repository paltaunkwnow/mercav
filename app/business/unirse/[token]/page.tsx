import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sessionUserId } from "@/lib/calendar/server";
import { hashInviteToken } from "@/lib/business/invites";
import { ROLE_HINTS_FOR_INVITEE, ROLE_LABELS, type BusinessRoleKey } from "@/lib/business/permissions";
import { AppPage } from "@/components/app-shell/AppPage";
import { Empty } from "@/components/business/ui";
import { JoinInvite } from "@/components/business/JoinInvite";

export const metadata: Metadata = { title: "Invitación", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function JoinPage({ params }: { params: { token: string } }) {
  const userId = await sessionUserId();
  if (!userId) redirect(`/login?callbackUrl=${encodeURIComponent(`/business/unirse/${params.token}`)}`);
  const invite = await prisma.businessInvite.findUnique({ where: { tokenHash: hashInviteToken(params.token) }, include: { workspace: { select: { name: true } } } });
  const valid = invite && !invite.usedAt && invite.expiresAt > new Date();

  return (
    <AppPage kicker="Mercav Business" title={valid ? `Te invitaron a ${invite!.workspace.name}` : "Invitación no válida"} width="narrow">
      {valid ? (
        <div className="mv-panel flex flex-col gap-4 p-5">
          <p className="text-sm text-[var(--text-secondary)]">
            Vas a entrar como <strong className="text-[var(--text-primary)]">{ROLE_LABELS[invite!.role as BusinessRoleKey]}</strong>: {ROLE_HINTS_FOR_INVITEE[invite!.role as BusinessRoleKey]}.
          </p>
          <JoinInvite token={params.token} />
        </div>
      ) : (
        <Empty title="Este link venció o ya se usó">Pedile a la empresa que te mande uno nuevo.</Empty>
      )}
    </AppPage>
  );
}
// creado por pato dev y askforvini
