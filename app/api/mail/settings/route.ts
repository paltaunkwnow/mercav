import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireMailSession } from "@/lib/mail/auth";
import { mailJson, mailRoute, readMailJson } from "@/lib/mail/http";
import { assertMailOrigin } from "@/lib/mail/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET() {
  return mailRoute(async () => {
    const { account } = await requireMailSession();
    return mailJson({ signature: account.signature });
  });
}
export function PATCH(request: Request) {
  return mailRoute(async () => {
    assertMailOrigin(request);
    const { accountId } = await requireMailSession();
    const data = z.object({ signature: z.string().max(4000) }).parse(await readMailJson(request, 20_000));
    await prisma.mailAccount.update({ where: { id: accountId }, data });
    return mailJson(data);
  });
}
