"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, ScanEye, X } from "lucide-react";
import { REASON_LABELS, displayIp } from "@/lib/security/unusual-traffic";
import { cn } from "@/lib/utils";
import { AdminPanel, EmptyState, KeyValue, Metric, MobileCard, StatusBadge, table } from "./ui";

type EventRow = {
  id: string;
  createdAt: string;
  reason: string;
  ip: string;
  userAgent: string | null;
  path: string | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  user: { id: string; email: string; username: string; name: string } | null;
};

function when(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

function accountOf(event: EventRow) {
  return event.user || (event.userEmail ? { email: event.userEmail, name: event.userName, username: "", id: event.userId || "" } : null);
}

const reasonLabel = (reason: string) => REASON_LABELS[reason] || reason;

/** Forensic log of inspection events. Read-only: who, when, from where, what route, which client. */
export function UnusualTrafficTab({ events }: { events: EventRow[] }) {
  const [reason, setReason] = useState<string>("all");
  const [session, setSession] = useState<"all" | "account" | "anonymous">("all");
  const [q, setQ] = useState("");

  const reasons = useMemo(() => {
    const counts = new Map<string, number>();
    events.forEach((e) => counts.set(e.reason, (counts.get(e.reason) || 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [events]);

  const summary = useMemo(() => {
    const ips = new Set(events.map((e) => displayIp(e.ip)));
    const withAccount = events.filter((e) => accountOf(e)).length;
    const accounts = new Set(events.map((e) => accountOf(e)?.email).filter(Boolean));
    return { ips: ips.size, withAccount, accounts: accounts.size };
  }, [events]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return events.filter((e) => {
      if (reason !== "all" && e.reason !== reason) return false;
      const account = accountOf(e);
      if (session === "account" && !account) return false;
      if (session === "anonymous" && account) return false;
      if (!needle) return true;
      return [displayIp(e.ip), e.path, e.userAgent, account?.email, account?.name, account?.username]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [events, reason, session, q]);

  if (events.length === 0) {
    return (
      <EmptyState
        icon={ScanEye}
        title="Sin eventos registrados"
        description="Cuando alguien abra las herramientas de inspección o use un cliente de intercepción, el evento quedará registrado acá."
      />
    );
  }

  const filtersActive = reason !== "all" || session !== "all" || q.trim() !== "";
  const first = when(events[events.length - 1].createdAt);

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Eventos cargados" value={events.length.toLocaleString("es-BO")} hint={<span suppressHydrationWarning>Desde {first.date}</span>} />
        <Metric label="IPs distintas" value={summary.ips.toLocaleString("es-BO")} />
        <Metric label="Con sesión iniciada" value={summary.withAccount.toLocaleString("es-BO")} hint={`${summary.accounts} cuentas distintas`} />
        <Metric label="Sin sesión" value={(events.length - summary.withAccount).toLocaleString("es-BO")} />
      </dl>

      <AdminPanel
        id="traffic-log"
        title="Registro de eventos"
        description={
          filtersActive
            ? `${filtered.length} de ${events.length} eventos coinciden con los filtros`
            : `Los ${events.length} eventos más recientes, del último al primero`
        }
        bodyClassName="p-0"
      >
        {/* Filters */}
        <div className="flex flex-col gap-3 border-b border-[var(--mv-hairline)] px-5 py-4 md:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <label htmlFor="traffic-search" className="sr-only">
                Buscar por IP, cuenta, ruta o navegador
              </label>
              <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                id="traffic-search"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por IP, cuenta, ruta o navegador"
                autoComplete="off"
                className="mv-input h-10 pl-10 text-sm"
              />
            </div>
            <div role="group" aria-label="Sesión" className="flex shrink-0 rounded-full border border-[var(--mv-hairline-strong)] p-0.5">
              {(
                [
                  ["all", "Todas"],
                  ["account", "Con cuenta"],
                  ["anonymous", "Sin sesión"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={session === value}
                  onClick={() => setSession(value)}
                  className={cn(
                    "mv-focus h-9 flex-1 whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition-colors duration-150",
                    session === value ? "bg-[var(--mv-panel-hover)] text-[var(--text-primary)] shadow-[inset_0_0_0_1px_var(--mv-hairline-strong)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div role="group" aria-label="Motivo" className="scrollbar-hide -mx-1 flex gap-1.5 overflow-x-auto px-1">
            <FilterChip active={reason === "all"} onClick={() => setReason("all")} label="Todos los motivos" count={events.length} />
            {reasons.map(([value, count]) => (
              <FilterChip key={value} active={reason === value} onClick={() => setReason(value)} label={reasonLabel(value)} count={count} />
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Ningún evento coincide"
              description="Probá con otro término o quitá los filtros."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    setReason("all");
                    setSession("all");
                  }}
                  className="mv-btn mv-btn-secondary mv-btn-sm"
                >
                  <X className="h-4 w-4" aria-hidden /> Quitar filtros
                </button>
              }
            />
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className={cn("hidden lg:block", table.wrap)}>
              <table className={table.table}>
                <caption className="sr-only">Eventos de inspección: fecha, motivo, IP, cuenta, ruta y navegador</caption>
                <thead>
                  <tr>
                    <th scope="col" className={table.th}>Fecha y hora</th>
                    <th scope="col" className={table.th}>Motivo</th>
                    <th scope="col" className={table.th}>IP</th>
                    <th scope="col" className={table.th}>Cuenta</th>
                    <th scope="col" className={table.th}>Ruta</th>
                    <th scope="col" className={cn(table.th, "w-[28%]")}>Navegador (user agent)</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((event) => {
                    const account = accountOf(event);
                    const t = when(event.createdAt);
                    return (
                      <tr key={event.id} className={table.tr}>
                        <td className={cn(table.td, "whitespace-nowrap")}>
                          <time dateTime={event.createdAt} className="mv-data flex flex-col text-xs">
                            <span suppressHydrationWarning className="text-[var(--text-primary)]">{t.date}</span>
                            <span suppressHydrationWarning className="text-[var(--text-tertiary)]">{t.time}</span>
                          </time>
                        </td>
                        <td className={table.td}>
                          <StatusBadge tone="gold">{reasonLabel(event.reason)}</StatusBadge>
                        </td>
                        <td className={cn(table.td, "mv-data whitespace-nowrap text-xs text-[var(--text-primary)]")}>{displayIp(event.ip)}</td>
                        <td className={table.td}>
                          <AccountCell account={account} />
                        </td>
                        <td className={cn(table.td, "mv-data min-w-[9rem] max-w-[16rem] break-all text-xs")}>{event.path || "—"}</td>
                        <td className={table.td}>
                          <UserAgent ua={event.userAgent} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / tablet */}
            <ol className="lg:hidden">
              {filtered.map((event) => {
                const account = accountOf(event);
                const t = when(event.createdAt);
                return (
                  <MobileCard key={event.id}>
                    <div className="flex items-start justify-between gap-3">
                      <time dateTime={event.createdAt} className="mv-data flex flex-col text-xs">
                        <span suppressHydrationWarning className="text-[var(--text-primary)]">{t.date}</span>
                        <span suppressHydrationWarning className="text-[var(--text-tertiary)]">{t.time}</span>
                      </time>
                      <StatusBadge tone="gold">{reasonLabel(event.reason)}</StatusBadge>
                    </div>
                    <dl className="flex flex-col gap-1.5">
                      <KeyValue label="IP" mono>{displayIp(event.ip)}</KeyValue>
                      <KeyValue label="Ruta" mono>{event.path || "—"}</KeyValue>
                      <KeyValue label="Cuenta">{account ? account.name || account.email : "Sin sesión"}</KeyValue>
                    </dl>
                    {account?.id ? (
                      <Link href={`/perfil/${account.id}`} className="mv-link inline-flex h-10 items-center self-start text-sm">
                        Ver perfil de {account.email}
                      </Link>
                    ) : null}
                    <UserAgent ua={event.userAgent} />
                  </MobileCard>
                );
              })}
            </ol>
          </>
        )}
      </AdminPanel>

      <p className="text-xs leading-relaxed text-[var(--text-tertiary)]">
        Se registran aperturas de las herramientas de inspección del navegador, sus atajos de teclado y clientes de intercepción conocidos.
        Un evento no prueba una intención maliciosa: usalo como contexto junto con el resto de la actividad de la cuenta.
      </p>
    </div>
  );
}

function FilterChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "mv-focus inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition-colors duration-150",
        active
          ? "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)] text-[var(--text-primary)]"
          : "border-[var(--mv-hairline-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
      )}
    >
      {label}
      <span className="mv-data text-xs text-[var(--text-tertiary)]">{count}</span>
    </button>
  );
}

function AccountCell({ account }: { account: ReturnType<typeof accountOf> }) {
  if (!account) return <span className="text-[var(--text-tertiary)]">Sin sesión</span>;
  return (
    <div className="min-w-0">
      <p className="truncate font-medium text-[var(--text-primary)]">{account.name || account.email}</p>
      <p className="truncate text-xs text-[var(--text-tertiary)]">{account.email}</p>
      {account.id ? (
        <Link href={`/perfil/${account.id}`} className="mv-link text-xs">
          Ver perfil
        </Link>
      ) : null}
    </div>
  );
}

/** Full UA is long; show a readable line and let the admin expand it. */
function UserAgent({ ua }: { ua: string | null }) {
  if (!ua) return <span className="text-xs text-[var(--text-tertiary)]">No informado</span>;
  return (
    <details className="group min-w-0">
      <summary className="mv-focus cursor-pointer list-none rounded-md text-xs text-[var(--text-secondary)] [&::-webkit-details-marker]:hidden">
        <span className="mv-data line-clamp-1 break-all group-open:hidden">{ua}</span>
        <span className="mv-link hidden text-xs group-open:inline">Ocultar user agent</span>
      </summary>
      <p className="mv-data mt-1 select-all break-all text-xs leading-relaxed text-[var(--text-secondary)]">{ua}</p>
    </details>
  );
}
// creado por pato dev y askforvini
