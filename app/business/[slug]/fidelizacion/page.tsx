import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Plus, QrCode, Smartphone, Sparkles, Store, Wallet } from "@/components/icons";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/business/context";
import { AppPage } from "@/components/app-shell/AppPage";
import { ButtonLink } from "@/components/site/primitives";
import { BusinessTabs } from "@/components/business/ui";
import { LoyaltyCard } from "@/components/business/loyalty/LoyaltyCard";
import { LoyaltyIcon } from "@/components/business/loyalty/icons";
import { STATUS_LABELS, statusChipClass } from "@/components/business/loyalty/panel/status";
import { programInclude, programView } from "@/lib/business/loyalty/service";
import { programSummaries } from "@/lib/business/loyalty/stats";
import { businessTemplate, defaultDesign } from "@/lib/business/loyalty/templates";

export const metadata: Metadata = { title: "Fidelización" };
export const dynamic = "force-dynamic";

const ORDER = { ACTIVE: 0, PAUSED: 1, DRAFT: 2, ARCHIVED: 3 } as const;

export default async function LoyaltyProgramsPage({ params }: { params: { slug: string } }) {
  const ctx = await requireBusiness(params.slug, "loyalty.view");
  const { workspace, role } = ctx;
  const base = `/business/${workspace.slug}/fidelizacion`;
  const programs = (await prisma.loyaltyProgram.findMany({ where: { workspaceId: workspace.id }, include: programInclude, orderBy: { createdAt: "desc" } }))
    .map(programView)
    .sort((a, b) => ORDER[a.status] - ORDER[b.status]);
  const summaries = await programSummaries(programs.map((p) => p.id));
  const canManage = ctx.can("loyalty.manage");
  const canStamp = ctx.can("loyalty.stamp");

  const create = canManage ? (
    <ButtonLink href={`${base}/nuevo`} size="sm">
      <Plus className="h-4 w-4" aria-hidden />
      Crear programa
    </ButtonLink>
  ) : null;

  if (!programs.length) {
    const sample = businessTemplate("CAFE");
    return (
      <AppPage kicker={workspace.name} title="Fidelización" tabs={<BusinessTabs slug={workspace.slug} role={role} active="fidelizacion" />}>
        <section className="mv-panel grid items-center gap-8 overflow-hidden p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          <div className="flex flex-col gap-5">
            <p className="mv-kicker">Nuevo en Mercav Business</p>
            <h2 className="font-display text-2xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] sm:text-3xl">Tu tarjeta de clientes, sin papel y sin apps.</h2>
            <p className="max-w-xl text-[15px] leading-relaxed text-[var(--text-secondary)]">
              Tus clientes escanean un QR, se suman en segundos y juntan sellos o puntos en una tarjeta con tu marca. Vos ves quién vuelve y quién dejó de venir.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Smartphone, title: "Sin descargar nada", text: "La tarjeta vive en el celular del cliente, en el navegador." },
                { icon: Store, title: "Para cualquier negocio", text: "Cafetería, peluquería, gimnasio, tienda, kiosco y más." },
                { icon: QrCode, title: "Sellar en un segundo", text: "Tu equipo escanea la tarjeta desde Mercav. Sin hardware extra." },
                { icon: Wallet, title: "Apple y Google Wallet", text: "Muy pronto, la tarjeta también en la billetera del celular." },
              ].map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold">
                    <item.icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-[var(--text-primary)]">{item.title}</span>
                    <span className="block text-xs leading-snug text-[var(--text-secondary)]">{item.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            {create ?? <p className="text-sm text-[var(--text-secondary)]">Pedile a quien administra la empresa que cree el primer programa.</p>}
          </div>
          <div className="mx-auto w-full max-w-[22rem]">
            <LoyaltyCard
              design={defaultDesign(sample, workspace.name)}
              type="STAMPS"
              stampsGoal={sample.goal}
              rewardName={sample.rewardName}
              balance={4}
              side="flip"
              size="md"
              className="w-full"
            />
            <p className="mt-3 text-center text-xs text-[var(--text-tertiary)]">Tocá la tarjeta para ver el reverso</p>
          </div>
        </section>
      </AppPage>
    );
  }

  return (
    <AppPage
      kicker={workspace.name}
      title="Fidelización"
      lead="Tus programas de sellos y puntos."
      actions={create}
      tabs={<BusinessTabs slug={workspace.slug} role={role} active="fidelizacion" />}
    >
      <ul className="grid gap-3">
        {programs.map((p) => {
          const s = summaries.get(p.id) ?? { members: 0, active30: 0, redeemed30: 0 };
          const main = p.rewards.find((r) => r.active);
          return (
            <li key={p.id} className="mv-panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div aria-hidden className="hidden w-[7.5rem] shrink-0 sm:block">
                  <LoyaltyCard design={p.design} type={p.type} stampsGoal={p.rules.stampsGoal} rewardName={main?.name} side="front" size="sm" className="w-full min-w-0" />
                </div>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gold/10 text-gold sm:hidden">
                  <LoyaltyIcon name={p.design.icon} className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`${base}/${p.id}`} className="mv-focus truncate rounded-md font-display text-lg font-semibold text-[var(--text-primary)] hover:underline">
                      {p.name}
                    </Link>
                    <span className={statusChipClass(p.status)}>{STATUS_LABELS[p.status]}</span>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-[var(--text-secondary)]">
                    <LoyaltyIcon name={p.design.icon} className="hidden h-3.5 w-3.5 sm:inline" />
                    {businessTemplate(p.businessType).label} · {p.type === "STAMPS" ? `${p.rules.stampsGoal} sellos` : "Puntos"}
                    {main ? ` · ${main.name}` : ""}
                  </p>
                  <dl className="mt-3 grid grid-cols-3 gap-4 sm:max-w-md">
                    {[
                      ["Clientes", s.members],
                      ["Activos 30 días", s.active30],
                      ["Canjes 30 días", s.redeemed30],
                    ].map(([label, value]) => (
                      <div key={label as string}>
                        <dt className="text-[11px] text-[var(--text-tertiary)]">{label}</dt>
                        <dd className="font-display text-lg font-semibold tabular-nums text-[var(--text-primary)]">{(value as number).toLocaleString("es")}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
              <div className="flex shrink-0 gap-2 sm:flex-col lg:flex-row">
                <ButtonLink href={`${base}/${p.id}`} tone="secondary" size="sm" className="flex-1 sm:flex-none">
                  Abrir
                  <ChevronRight className="h-4 w-4" aria-hidden />
                  <span className="sr-only"> {p.name}</span>
                </ButtonLink>
                {canStamp && p.status === "ACTIVE" ? (
                  <ButtonLink href={`/business/${workspace.slug}/sellar`} size="sm" className="flex-1 sm:flex-none">
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Sellar
                  </ButtonLink>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </AppPage>
  );
}
// creado por pato dev y askforvini
