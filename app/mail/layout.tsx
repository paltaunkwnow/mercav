import type { Metadata } from "next";
import "./mail.css";

export const metadata: Metadata = {
  title: { absolute: "Mercav Mail · Correo del equipo" },
  description: "Correo privado del equipo Mercav. Acceso exclusivo para cuentas autorizadas.",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default function MailLayout({ children }: { children: React.ReactNode }) {
  return <div className="mercav-mail">{children}</div>;
}
