import type { Metadata } from "next";
import { Suspense } from "react";
import { PwnShell } from "@/components/pwn/PwnShell";

export const metadata: Metadata = {
  title: "Mercav Pwn",
  description: "Cyber Intelligence & Exposure Monitoring. Detect. Investigate. Protect.",
};

export default function PwnLayout({ children }: { children: React.ReactNode }) {
  return (
    <PwnShell>
      <Suspense fallback={<p className="text-sm text-gray-400">Cargando…</p>}>{children}</Suspense>
    </PwnShell>
  );
}
// creado por Patodev y Invertilo
