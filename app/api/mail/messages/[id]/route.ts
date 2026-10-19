import { z } from "zod";
import { requireMailSession } from "@/lib/mail/auth";
import { getMessage, updateMessage } from "@/lib/mail/jmap";
import { mailJson, mailRoute, readMailJson } from "@/lib/mail/http";
import { assertMailOrigin } from "@/lib/mail/config";
import { mailId } from "@/lib/mail/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(_request: Request, { params }: { params: { id: string } }) {
  return mailRoute(async () => {
    const session = await requireMailSession();
    return mailJson({ message: await getMessage({ email: session.account.email, password: session.password, accountId: session.jmapAccountId }, mailId.parse(params.id)) });
  });
}
export function PATCH(request: Request, { params }: { params: { id: string } }) {
  return mailRoute(async () => {
    assertMailOrigin(request);
    const session = await requireMailSession();
    const data = z.object({ action: z.enum(["read", "unread", "star", "unstar", "move"]), mailboxId: mailId.optional() }).parse(await readMailJson(request, 4096));
    await updateMessage({ email: session.account.email, password: session.password, accountId: session.jmapAccountId }, mailId.parse(params.id), data.action, data.mailboxId);
    return mailJson({ updated: true });
  });
}
