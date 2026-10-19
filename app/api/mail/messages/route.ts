import { requireMailSession, rateLimitMail, auditMail } from "@/lib/mail/auth";
import { composeMessage, listMessages } from "@/lib/mail/jmap";
import { mailJson, mailRoute, readMailJson } from "@/lib/mail/http";
import { assertMailOrigin, MailError } from "@/lib/mail/config";
import { composeSchema, mailId } from "@/lib/mail/validation";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(request: Request) {
  return mailRoute(async () => {
    const session = await requireMailSession();
    const params = new URL(request.url).searchParams;
    const mailboxId = mailId.optional().parse(params.get("mailboxId") || undefined);
    const q = z.string().max(200).optional().parse(params.get("q") || undefined);
    const position = z.coerce.number().int().min(0).max(100_000).parse(params.get("position") || 0);
    return mailJson(await listMessages({ email: session.account.email, password: session.password, accountId: session.jmapAccountId }, mailboxId, q, position));
  });
}
export function POST(request: Request) {
  return mailRoute(async () => {
    assertMailOrigin(request);
    const session = await requireMailSession();
    const input = composeSchema.parse(await readMailJson(request));
    if (!input.draft && !input.confirmExternal && [...input.to, ...input.cc, ...input.bcc].some((email) => !email.endsWith("@mercav.lat"))) throw new MailError(409, "Confirmá que querés enviar este mensaje a destinatarios externos.");
    await rateLimitMail(`compose:${session.accountId}`, input.draft ? 60 : 20, 60);
    if (!input.draft) await rateLimitMail(`send:daily:${session.accountId}`, 300, 86400);
    const result = await composeMessage({ email: session.account.email, password: session.password, accountId: session.jmapAccountId }, input);
    await auditMail(input.draft ? "DRAFT_SAVED" : "MESSAGE_SUBMITTED", session.accountId);
    return mailJson(result, 201);
  });
}
