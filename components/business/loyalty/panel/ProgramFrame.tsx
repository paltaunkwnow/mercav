import type { ReactNode } from "react";
import { AppPage, AppTabs } from "@/components/app-shell/AppPage";
import type { LoyaltyTypeKey } from "@/lib/business/loyalty/types";
import { STATUS_LABELS, statusChipClass, type ProgramStatus } from "./status";

export type ProgramTab = "resumen" | "clientes" | "campanas" | "mostrador" | "ajustes";

/** Marco de las páginas de un programa: encabezado, estado y pestañas. Componente de servidor (sin estado). */
export function ProgramFrame({
  slug,
  program,
  workspaceName,
  active,
  canManage,
  children,
}: {
  slug: string;
  program: { id: string; name: string; status: ProgramStatus; type: LoyaltyTypeKey };
  workspaceName: string;
  active: ProgramTab;
  canManage: boolean;
  children: ReactNode;
}) {
  const base = `/business/${slug}/fidelizacion/${program.id}`;
  const items = [
    { key: "resumen", label: "Resumen", href: base },
    { key: "clientes", label: "Clientes", href: `${base}/clientes` },
    { key: "campanas", label: "Campañas", href: `${base}/campanas` },
    { key: "mostrador", label: "Mostrador", href: `${base}/cartel` },
    ...(canManage ? [{ key: "ajustes", label: "Ajustes", href: `${base}/ajustes` }] : []),
  ];
  return (
    <AppPage
      kicker={`${workspaceName} · Fidelización`}
      title={program.name}
      back={{ href: `/business/${slug}/fidelizacion`, label: "Programas" }}
      actions={
        <span className={statusChipClass(program.status)}>
          <span aria-hidden className={program.status === "ACTIVE" ? "h-1.5 w-1.5 rounded-full bg-current" : "h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)]"} />
          {STATUS_LABELS[program.status]}
          <span className="sr-only"> · {program.type === "STAMPS" ? "Sellos" : "Puntos"}</span>
        </span>
      }
      tabs={<AppTabs items={items} active={active} />}
      width="wide"
    >
      {children}
    </AppPage>
  );
}
// creado por pato dev y askforvini
