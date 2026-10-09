import nodemailer from "nodemailer";
import { APP_URL } from "@/lib/seo/site";

/** Mismo SMTP que usa /api/contact/investors. Sin estas variables, Pwn no promete enviar nada. */
export function mailerReady(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** Base pública de los enlaces: NEXTAUTH_URL en previews y local, la app en producción. */
function publicBaseUrl(): string {
  const configured = process.env.NEXTAUTH_URL?.trim();
  if (configured && /^https?:\/\//i.test(configured)) return configured.replace(/\/$/, "");
  return APP_URL;
}

export function mailboxConfirmationLink(token: string): string {
  return `${publicBaseUrl()}/pwn/confirmar?token=${encodeURIComponent(token)}`;
}

/**
 * Manda el enlace para confirmar que el buzón es de quien lo sigue. El correo solo vive en memoria
 * durante el envío: en la base queda el hash del objetivo y el hash del token.
 */
export async function sendMailboxConfirmation(to: string, link: string): Promise<boolean> {
  if (!mailerReady()) return false;
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "no-reply@mercav.lat",
      to,
      subject: "Confirmá que este correo es tuyo · Mercav Pwn",
      text: [
        "Alguien con una cuenta de Mercav pidió vigilar este correo en Mercav Pwn (filtraciones de datos).",
        "",
        "Si fuiste vos, abrí este enlace con la misma cuenta en las próximas 48 horas:",
        link,
        "",
        "Si no fuiste vos, ignorá este mensaje: sin la confirmación no se muestra el detalle de las filtraciones ni se generan alertas.",
        "Mercav nunca te va a pedir tu contraseña por correo.",
      ].join("\n"),
    });
    return true;
  } catch (error) {
    console.warn("Pwn mailbox confirmation failed", error instanceof Error ? error.message : "unknown");
    return false;
  }
}
// creado por pato dev y askforvini
