import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, PencilLine, ShieldCheck } from "@/components/icons";
import { Notice } from "@/components/business/ui";
import { LoyaltyCard } from "@/components/business/loyalty/LoyaltyCard";
import { ProgramFrame } from "@/components/business/loyalty/panel/ProgramFrame";
import { ProgramStatusBar } from "@/components/business/loyalty/panel/ProgramStatusBar";
import { WeeklyActivity } from "@/components/business/loyalty/panel/WeeklyActivity";
import { programStats } from "@/lib/business/loyalty/stats";
import { percent } from "@/lib/business/loyalty/stats-core";
import { panelProgram } from "../_lib/program";

export const metadata: Metadata = { title: "Fidelización" };
export const dynamic = "force-dynamic";

function Tile({ label, value, hint, href }: { label: string; value: ReactNode; hint?: ReactNode; href?: string }) {
  const body = (
    <>
      <span className="text-xs font-semibold text-[var(--text-tertiary)]">{label}</span>
      <span className="font-display text-2xl font-semibold tabular-nums text-[var(--text-primary)]">{value}</span>
      {hint ? <span className="text-xs text-[var(--text-secondary)]">{hint}</span> : null}
    </>
  );
  if (!href) return <div className="mv-panel flex flex-col gap-1 p-4">{body}</div>;
  return (
    <Link href={href} className="mv-panel mv-panel-interactive mv-focus group relative flex flex-col gap-1 p-4">
      {body}
      <ChevronRight className="absolute right-3 top-4 h-4 w-4 text-[var(--text-tertiary)] transition-colors group-hover:text-gold" aria-hidden />
    </Link>
  );
}

export default async function ProgramOverviewPage({ params, searchParams }: { params: { slug: string; programId: string }; searchParams: { nuevo?: string } }) {
  const { ctx, view } = await panelProgram(params.slug, params.programId, "loyalty.view");
  const { workspace } = ctx;
  const stats = await programStats(view);
  const canManage = ctx.can("loyalty.manage");
  const base = `/business/${workspace.slug}/fidelizacion/${view.id}`;
  const unit = view.type === "STAMPS" ? "sellos" : "puntos";
  const n = (v: number) => v.toLocaleString("es");
  const main = view.rewards.find((r) => r.active);

  return (
    <ProgramFrame slug={workspace.slug} program={view} workspaceName={workspace.name} active="resumen" canManage={canManage}>
      <div className="flex flex-col gap-6">
        {searchParams.nuevo === "1" && view.status === "DRAFT" ? (
          <Notice>
            <strong className="font-semibold text-[var(--text-primary)]">¡Listo! Tu programa quedó en borrador.</strong> Mirá cómo quedó la tarjeta, revisá los premios y activalo cuando quieras.
          </Notice>
        ) : null}

        <ProgramStatusBar
          slug={workspace.slug}
          programId={view.id}
          programSlug={view.slug}
          status={view.status}
          type={view.type}
          canManage={canManage}
          hasActiveReward={view.rewards.some((r) => r.active)}
        />

        <section aria-labelledby="numbers-title" className="flex flex-col gap-3">
          <h2 id="numbers-title" className="sr-only">
            Números del programa
          </h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile label="Clientes" value={n(stats.members)} hint={stats.blocked ? `${n(stats.blocked)} bloqueados` : "Tarjetas creadas"} href={`${base}/clientes`} />
            <Tile label="Nuevos este mes" value={n(stats.newThisMonth)} />
            <Tile label="Activos (30 días)" value={n(stats.active30)} hint={`${percent(stats.active30, stats.members)} % del total`} />
            <Tile label={`${unit[0].toUpperCase()}${unit.slice(1)} dados (30 días)`} value={n(stats.earned30)} />
            <Tile label="Premios canjeados (30 días)" value={n(stats.redeemed30)} />
            <Tile label="Vuelven" value={`${stats.repeatRate} %`} hint={`${n(stats.repeatCount)} con 2 visitas o más`} />
            <Tile label="En riesgo" value={n(stats.atRisk)} hint="Sin visitas en 30 días" href={`${base}/clientes?filtro=atRisk`} />
            <Tile label="Con premio para canjear" value={n(stats.rewardReady)} hint={main ? `Desde ${main.name}` : undefined} href={`${base}/clientes?filtro=reward`} />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <section aria-labelledby="weekly-title" className="mv-panel flex flex-col gap-4 p-5 sm:p-6">
            <div>
              <h2 id="weekly-title" className="font-display text-lg font-semibold text-[var(--text-primary)]">
                Actividad de las últimas 8 semanas
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">Cada barra es una semana. La última es la actual.</p>
            </div>
            <WeeklyActivity weekly={stats.weekly} />
          </section>

          <section aria-labelledby="card-title" className="mv-panel flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 id="card-title" className="font-display text-lg font-semibold text-[var(--text-primary)]">
                La tarjeta
              </h2>
              {canManage ? (
                <Link href={`${base}/ajustes#diseno`} className="mv-link inline-flex items-center gap-1 text-sm">
                  <PencilLine className="h-3.5 w-3.5" aria-hidden />
                  Editar
                </Link>
              ) : null}
            </div>
            <LoyaltyCard
              design={view.design}
              type={view.type}
              stampsGoal={view.rules.stampsGoal}
              rewardName={main?.name}
              pointsGoal={view.type === "POINTS" ? main?.cost ?? null : null}
              balance={view.type === "STAMPS" ? Math.min(3, view.rules.stampsGoal - 1) : Math.round((main?.cost ?? 100) * 0.4)}
              side="flip"
              size="md"
              className="w-full"
            />
            <p className="text-xs text-[var(--text-tertiary)]">Tocá la tarjeta para ver el reverso.</p>
          </section>
        </div>

        <section aria-labelledby="control-title" className="mv-panel flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold">
              <ShieldCheck className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h2 id="control-title" className="font-display text-lg font-semibold text-[var(--text-primary)]">
                Control de hoy
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Quién sumó y qué tarjetas llegaron al tope diario ({n(view.rules.maxPerDay)} {unit}). Si una tarjeta llega al tope todos los días, conviene revisarla.
              </p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Sumas por persona</h3>
              {stats.staffToday.length ? (
                <ul className="divide-y divide-[var(--mv-hairline)] rounded-2xl border border-[var(--mv-hairline)]">
                  {stats.staffToday.map((s) => (
                    <li key={s.userId} className="flex items-center justify-between gap-3 px-4 py-2.5">
                      <span className="min-w-0 truncate text-sm text-[var(--text-primary)]">{s.name}</span>
                      <span className="shrink-0 text-right text-xs text-[var(--text-secondary)]">
                        <span className="font-semibold tabular-nums text-[var(--text-primary)]">{n(s.amount)}</span> {unit} · {n(s.actions)} {s.actions === 1 ? "vez" : "veces"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-2xl border border-dashed border-[var(--mv-hairline-strong)] px-4 py-3 text-sm text-[var(--text-secondary)]">Hoy todavía nadie sumó desde el mostrador.</p>
              )}
              {view.rules.selfService && view.type === "STAMPS" ? (
                <p className="text-xs text-[var(--text-secondary)]">
                  Autoservicio hoy: <span className="font-semibold tabular-nums text-[var(--text-primary)]">{n(stats.selfServiceToday)}</span> sellos.
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Tarjetas en el tope diario</h3>
              {stats.cappedToday.length ? (
                <ul className="divide-y divide-[var(--mv-hairline)] rounded-2xl border border-[var(--mv-hairline)]">
                  {stats.cappedToday.map((c) => (
                    <li key={c.cardId}>
                      <Link
                        href={`${base}/clientes?tarjeta=${encodeURIComponent(c.cardId)}`}
                        className="mv-focus flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5 transition-colors hover:bg-[var(--mv-panel-hover)]"
                      >
                        <span className="min-w-0 truncate text-sm text-[var(--text-primary)]">{c.name}</span>
                        <span className="flex shrink-0 items-center gap-1 text-xs text-[var(--text-secondary)]">
                          <span className="font-semibold tabular-nums text-amber-500">{n(c.amount)}</span> {unit}
                          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-2xl border border-dashed border-[var(--mv-hairline-strong)] px-4 py-3 text-sm text-[var(--text-secondary)]">Ninguna tarjeta llegó al tope hoy.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </ProgramFrame>
  );
}
// creado por pato dev y askforvini
