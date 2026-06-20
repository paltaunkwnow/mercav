import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = body.name;
    const email = body.email;
    const company = body.company;
    const message = body.message;

    const record = await prisma.investorContact.create({ data: { name, email, company, message } });

    // send email to team if SMTP configured
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT||587), secure: false, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
        await transporter.sendMail({ from: process.env.SMTP_FROM || 'no-reply@mercav.lat', to: process.env.INVESTOR_CONTACT_EMAIL || process.env.SMTP_USER, subject: 'Nuevo contacto de inversor', text: `Nombre: ${name}\nEmail: ${email}\nEmpresa: ${company}\nMensaje:\n${message}` });
      } catch (e) { console.warn('Mail send failed', e); }
    }

    return NextResponse.json({ success: true, data: record });
  } catch (err) {
    console.error('Investor contact error', err);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
