import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { assertMailOrigin, mailConfig, mailCookieName } from "@/lib/mail/config";
import { hashToken } from "@/lib/mail/crypto";
import { mailJson, mailRoute } from "@/lib/mail/http";

export const runtime = "nodejs";
export function POST(request: Request) {
  return mailRoute(async () => {
    assertMailOrigin(request);
    const token = cookies().get(mailCookieName())?.value;
    if (token) await prisma.mailSession.deleteMany({ where: { tokenHash: hashToken(token) } });
    const response = mailJson({ loggedOut: true });
    response.cookies.set(mailCookieName(), "", { httpOnly: true, secure: mailConfig().secure, sameSite: "strict", path: "/", maxAge: 0 });
    return response;
  });
}
