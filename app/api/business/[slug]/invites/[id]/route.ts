import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiBusiness } from "@/lib/business/context";
import { audit } from "@/lib/business/audit";

export async function DELETE(_req: Request, { params }: { params: { slug: string; id: string } }) {
  const auth = await apiBusiness(params.slug, "invites.manage");
  if ("error" in auth) return auth.error;
  const { ctx } = auth;
  const result = await prisma.businessInvite.deleteMany({ where: { id: params.id, workspaceId: ctx.workspace.id, usedAt: null } });
  if (!result.count) return NextResponse.json({ success: false, error: "No encontrado" }, { status: 404 });
  await audit(ctx.workspace.id, ctx.userId, "invite.revoke", "BusinessInvite", params.id);
  return NextResponse.json({ success: true });
}
// creado por pato dev y askforvini
