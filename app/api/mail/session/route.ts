import { requireMailSession } from "@/lib/mail/auth";
import { mailJson, mailRoute } from "@/lib/mail/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET() {
  return mailRoute(async () => {
    const { account, expiresAt } = await requireMailSession();
    return mailJson({ user: { email: account.email, name: account.name, role: account.role }, expiresAt });
  });
}
