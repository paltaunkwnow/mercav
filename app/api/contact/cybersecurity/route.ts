import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import nodemailer from "nodemailer";
import { checkRateLimit } from "@/app/api/pwn/_lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  company: z.string().trim().max(160).optional().default(""),
  service: z.enum(["Pentesting autorizado", "Auditoría de seguridad", "Respuesta a incidentes", "Remediación y retest", "Otra consulta"]),
  message: z.string().trim().min(10).max(800),
  website: z.string().max(200).optional().default(""),
}).strict();

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && new URL(request.url).origin !== origin) {
    return NextResponse.json({ success: false, error: "Origen no permitido." }, { status: 403 });
  }

  const limited = await checkRateLimit(request, {
    route: "cybersecurity-contact",
    capacity: 5,
    refillPerMinute: 0.25,
    message: "Recibimos varias consultas desde esta conexión. Probá de nuevo más tarde.",
  });
  if (limited) return limited;

  const input = await request.json().catch(() => null);
  const parsed = schema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ success: false, error: "Revisá los campos e intentá de nuevo." }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ success: true });

  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  const recipient = process.env.CYBERSECURITY_CONTACT_EMAIL || SMTP_USER;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !recipient) {
    return NextResponse.json({ success: false, error: "El canal de consultas todavía no está habilitado. Escribinos desde Contacto general." }, { status: 503 });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || SMTP_USER,
      to: recipient,
      replyTo: parsed.data.email,
      subject: `Consulta de ciberseguridad: ${parsed.data.service}`,
      text: `Nombre: ${parsed.data.name}\nCorreo: ${parsed.data.email}\nEmpresa: ${parsed.data.company || "No indicada"}\nServicio: ${parsed.data.service}\n\nConsulta general:\n${parsed.data.message}\n\nEl formulario advierte no compartir información técnica sensible.`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cybersecurity contact delivery failed", error);
    return NextResponse.json({ success: false, error: "No se pudo enviar la consulta. Probá de nuevo más tarde." }, { status: 502 });
  }
}
