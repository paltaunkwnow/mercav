import type { ReactNode } from "react";
import { AlertTriangle, Info } from "@/components/icons";
import { AppTabs } from "@/components/app-shell/AppPage";
import { can, type BusinessRoleKey } from "@/lib/business/permissions";
import { cn } from "@/lib/utils";

export function BusinessTabs({ slug, role, active }: { slug: string; role: BusinessRoleKey; active: string }) {
  const base = `/business/${slug}`;
  // La caja abre en la primera sección que el rol puede usar (el contador va directo a reportes).
  const caja = can(role, "pos.sell") ? `${base}/caja` : can(role, "pos.reports") ? `${base}/caja/reportes` : null;
  const items = can(role, "employees.view")
    ? [
        { key: "resumen", label: "Resumen", href: base },
        ...(can(role, "pos.reports") ? [{ key: "dashboard", label: "KPIs", href: `${base}/dashboard/kpis` }] : []),
        { key: "trabajadores", label: "Trabajadores", href: `${base}/trabajadores` },
        { key: "turnos", label: "Turnos", href: `${base}/turnos` },
        { key: "fichaje", label: "Fichaje", href: `${base}/fichaje` },
        ...(can(role, "payroll.view") ? [{ key: "planillas", label: "Planillas", href: `${base}/planillas` }] : []),
        ...(can(role, "expenses.view") ? [{ key: "gastos", label: "Gastos", href: `${base}/gastos` }] : []),
        ...(can(role, "loyalty.view") ? [{ key: "fidelizacion", label: "Fidelización", href: `${base}/fidelizacion` }] : []),
        ...(can(role, "loyalty.stamp") ? [{ key: "sellar", label: "Sellar", href: `${base}/sellar` }] : []),
        ...(caja ? [{ key: "caja", label: "Caja", href: caja }] : []),
        ...(can(role, "publicPage.edit") ? [{ key: "pagina", label: "Mi página", href: `${base}/pagina` }] : []),
        ...(can(role, "workspace.edit") || can(role, "members.manage") ? [{ key: "ajustes", label: "Ajustes", href: `${base}/ajustes` }] : []),
      ]
    : [
        { key: "resumen", label: "Mi legajo", href: base },
        { key: "boletas", label: "Mis boletas", href: `${base}/mis-boletas` },
        ...(can(role, "loyalty.stamp") ? [{ key: "sellar", label: "Sellar", href: `${base}/sellar` }] : []),
        ...(caja ? [{ key: "caja", label: "Caja", href: caja }] : []),
      ];
  return <AppTabs items={items} active={active} />;
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mv-panel flex flex-col gap-1 p-4">
      <span className="text-xs font-semibold text-[var(--text-tertiary)]">{label}</span>
      <span className="font-display text-2xl font-semibold tabular-nums text-[var(--text-primary)]">{value}</span>
      {hint ? <span className="text-xs text-[var(--text-secondary)]">{hint}</span> : null}
    </div>
  );
}

export function Notice({ tone = "info", children, className }: { tone?: "info" | "warn"; children: ReactNode; className?: string }) {
  const Icon = tone === "warn" ? AlertTriangle : Info;
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 text-sm leading-relaxed",
        tone === "warn" ? "border-amber-500/30 bg-amber-500/10 text-[var(--text-primary)]" : "border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-[var(--text-secondary)]",
        className,
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone === "warn" ? "text-amber-500" : "text-gold")} aria-hidden />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Field({ label, htmlFor, hint, children, className }: { label: string; htmlFor: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-[var(--text-primary)]">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs leading-snug text-[var(--text-secondary)]">{hint}</p> : null}
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mv-panel flex flex-col items-start gap-3 p-6">
      <p className="font-display text-lg font-semibold text-[var(--text-primary)]">{title}</p>
      {children ? <div className="text-sm text-[var(--text-secondary)]">{children}</div> : null}
      {action}
    </div>
  );
}
// creado por pato dev y askforvini
