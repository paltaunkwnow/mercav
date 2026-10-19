import { requireMailSession, rateLimitMail } from "@/lib/mail/auth";
import { downloadAttachment, getMessage, uploadAttachment } from "@/lib/mail/jmap";
import { mailJson, mailRoute } from "@/lib/mail/http";
import { assertMailOrigin, MailError } from "@/lib/mail/config";
import { mailId } from "@/lib/mail/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_UPLOAD = 10 * 1024 * 1024;
export function POST(request: Request) {
  return mailRoute(async () => {
    assertMailOrigin(request);
    const session = await requireMailSession();
    await rateLimitMail(`upload:${session.accountId}`, 20, 60);
    if (!(request.headers.get("content-type") || "").startsWith("multipart/form-data")) throw new MailError(415, "Se requiere un archivo adjunto.");
    // Bound streamed bytes before multipart parsing, including chunked requests.
    const reader = request.body?.getReader();
    if (!reader) throw new MailError(400, "Elegí un archivo.");
    let size = 0; const chunks: Uint8Array[] = [];
    while (true) {
      const result = await reader.read(); if (result.done) break;
      size += result.value.byteLength;
      if (size > MAX_UPLOAD + 16_384) { await reader.cancel(); throw new MailError(413, "Cada adjunto puede tener hasta 10 MB."); }
      chunks.push(result.value);
    }
    const body = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type")! } }).formData();
    const file = body.get("file");
    if (!file || typeof file === "string" || file.size > MAX_UPLOAD || file.size === 0) throw new MailError(400, "Adjuntá un archivo de hasta 10 MB.");
    const name = file.name.replace(/[\r\n\x00-\x1f/\\]/g, "_").slice(0, 255) || "adjunto";
    if (/\.(exe|com|bat|cmd|scr|ps1|vbs|js|jar|msi|hta|lnk|sh)$/i.test(name)) throw new MailError(400, "Ese tipo de archivo ejecutable no está permitido.");
    const type = /^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(file.type) ? file.type : "application/octet-stream";
    const uploaded = await uploadAttachment({ email: session.account.email, password: session.password, accountId: session.jmapAccountId }, await file.arrayBuffer(), type);
    return mailJson({ blobId: uploaded.blobId, name, type: uploaded.type, size: uploaded.size }, 201);
  });
}
export function GET(request: Request) {
  return mailRoute(async () => {
    const session = await requireMailSession();
    const params = new URL(request.url).searchParams;
    const messageId = mailId.parse(params.get("messageId"));
    const blobId = mailId.parse(params.get("blobId"));
    const connection = { email: session.account.email, password: session.password, accountId: session.jmapAccountId };
    const message = await getMessage(connection, messageId);
    const attachment = message.attachments?.find((entry) => entry.blobId === blobId);
    if (!attachment) throw new MailError(404, "No encontramos ese adjunto.");
    const upstream = await downloadAttachment(connection, attachment);
    // Never execute HTML, SVG or other active content in the mail origin.
    const safeName = attachment.name.replace(/[\r\n\x00-\x1f"/\\]/g, "_");
    return new Response(upstream.body, { headers: {
      "Content-Type": "application/octet-stream", "Content-Disposition": `attachment; filename="adjunto"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
      "Content-Security-Policy": "default-src 'none'; sandbox", "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store, private",
    } });
  });
}
