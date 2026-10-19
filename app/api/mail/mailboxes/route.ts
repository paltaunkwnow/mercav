import { requireMailSession } from "@/lib/mail/auth";
import { getMailboxes, jmapCall } from "@/lib/mail/jmap";
import { mailJson, mailRoute, readMailJson } from "@/lib/mail/http";
import { assertMailOrigin, MailError } from "@/lib/mail/config";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET() {
  return mailRoute(async () => {
    const session = await requireMailSession();
    return mailJson({ mailboxes: await getMailboxes({ email: session.account.email, password: session.password, accountId: session.jmapAccountId }) });
  });
}
export function POST(request: Request) {
  return mailRoute(async () => {
    assertMailOrigin(request);
    const session = await requireMailSession();
    const { name } = z.object({ name: z.string().trim().min(1).max(100) }).parse(await readMailJson(request, 4096));
    const result = await jmapCall({ email: session.account.email, password: session.password, accountId: session.jmapAccountId }, "Mailbox/set", { create: { folder: { name } } });
    if (!result.created?.folder) throw new MailError(409, "No se pudo crear la carpeta.");
    return mailJson({ id: result.created.folder.id }, 201);
  });
}
