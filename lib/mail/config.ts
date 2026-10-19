import "server-only";

export class MailError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "MailError";
    this.status = status;
  }
}

export function mailConfig() {
  if (process.env.MAIL_ENABLED !== "true") throw new MailError(503, "Mercav Mail todavía no está habilitado.");
  const publicUrl = new URL(process.env.MAIL_PUBLIC_URL || "https://mail.mercav.lat");
  const jmapUrl = new URL(process.env.MAIL_JMAP_URL || "https://mx1.mercav.lat/.well-known/jmap");
  const local = process.env.NODE_ENV !== "production";
  for (const url of [publicUrl, jmapUrl]) {
    if (url.protocol !== "https:" && !(local && url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
      throw new MailError(503, "Configuración TLS de correo incompleta.");
    }
    if (url.username || url.password) throw new MailError(503, "Configuración de correo inválida.");
  }
  const key = process.env.MAIL_SESSION_KEY || "";
  if (!/^[a-fA-F0-9]{64}$/.test(key)) throw new MailError(503, "Configuración de seguridad de correo incompleta.");
  return { publicUrl, jmapUrl, key: Buffer.from(key, "hex"), secure: publicUrl.protocol === "https:", domain: "mercav.lat" };
}

export function assertMailOrigin(request: Request) {
  const { publicUrl } = mailConfig();
  if (request.headers.get("origin") !== publicUrl.origin) throw new MailError(403, "Origen de la solicitud no autorizado.");
  if (request.headers.get("x-mercav-mail") !== "1") throw new MailError(403, "La solicitud no pudo verificarse. Recargá la página.");
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") throw new MailError(403, "Solicitud no autorizada.");
}

export function mailCookieName() { return mailConfig().secure ? "__Host-mercav-mail" : "mercav-mail-local"; }
