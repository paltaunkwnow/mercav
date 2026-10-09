import Link from "next/link";
import type { ReactNode } from "react";
import { Compass } from "@/components/icons";
import { buttonClass } from "@/components/site/primitives";
import { AdminMobileNav, AdminSidebarNav, BackToSite } from "./AdminNav";
import { ADMIN_TABS } from "./tabs";
import { Avatar, EmptyState, StatusBadge } from "./ui";

/** Console frame: desktop rail, floating context bar (Liquid Glass) with mobile tabs, page header. */
export function AdminShell({ activeTab, adminName, children }: { activeTab: string; adminName: string; children: ReactNode }) {
  const tab = ADMIN_TABS.find((t) => t.id === activeTab);
  return (
  <div className="min-h-screen bg-bg-primary text-[var(--text-primary)]">
    <a href="#admin-main" className="mv-skip">
      Saltar al contenido
    </a>

    {/* Desktop rail */}
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[var(--mv-hairline)] bg-bg-secondary lg:flex">
      <div className="flex h-[4.5rem] shrink-0 items-center gap-3 px-6">
        <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-[0.625rem] bg-gold font-display text-sm font-semibold text-[var(--mv-on-gold)]">
          M
        </span>
        <div className="leading-tight">
          <p className="font-display text-[0.9375rem] font-semibold tracking-tight">Mercav</p>
          <p className="text-xs text-[var(--text-tertiary)]">Consola de administración</p>
        </div>
      </div>
      <AdminSidebarNav active={activeTab} />
      <div className="border-t border-[var(--mv-hairline)] px-3 py-3">
        <BackToSite />
      </div>
    </aside>

    <div className="lg:pl-64">
      {/* Floating context bar */}
      <div className="sticky top-0 z-30 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4 lg:px-8">
        <div className="liquid-glass rounded-[1.25rem] px-2 py-2 sm:px-3">
          <div className="flex h-10 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 pl-1">
              <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[0.5rem] bg-gold font-display text-xs font-semibold text-[var(--mv-on-gold)] lg:hidden">
                M
              </span>
              <nav aria-label="Ubicación" className="min-w-0">
                <ol className="flex min-w-0 items-center gap-1.5 text-sm">
                  <li className="hidden shrink-0 text-[var(--text-tertiary)] sm:block">Consola</li>
                  <li aria-hidden className="hidden text-[var(--text-tertiary)] sm:block">/</li>
                  {tab ? (
                    <>
                      <li className="hidden shrink-0 text-[var(--text-tertiary)] md:block">{tab.group}</li>
                      <li aria-hidden className="hidden text-[var(--text-tertiary)] md:block">/</li>
                      <li aria-current="page" className="truncate font-semibold text-[var(--text-primary)]">
                        {tab.label}
                      </li>
                    </>
                  ) : (
                    <li className="truncate font-semibold">Consola</li>
                  )}
                </ol>
              </nav>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className="hidden items-center gap-2 rounded-full border border-[var(--mv-hairline-strong)] py-1 pl-1 pr-3 text-sm text-[var(--text-secondary)] sm:inline-flex">
                <Avatar name={adminName} size="sm" />
                <span className="max-w-[14rem] truncate">{adminName}</span>
                <StatusBadge tone="gold" className="h-5 px-2 text-[0.6875rem]">Admin</StatusBadge>
              </span>
              <span className="lg:hidden">
                <BackToSite compact />
              </span>
            </div>
          </div>
          <div className="mt-2 lg:hidden">
            <AdminMobileNav active={activeTab} />
          </div>
        </div>
      </div>

      <main id="admin-main" tabIndex={-1} className="mx-auto w-full max-w-[88rem] px-4 pb-16 pt-8 outline-none sm:px-6 lg:px-8 lg:pt-10">
        {tab ? (
          <header className="mb-8 flex flex-col gap-2">
            <p className="mv-kicker">{tab.group}</p>
            <h1 className="font-display text-[1.875rem] font-semibold leading-tight tracking-[-0.025em] text-[var(--text-primary)] md:text-[2.25rem]">
              {tab.title}
            </h1>
            <p className="max-w-2xl text-[0.9375rem] text-[var(--text-secondary)]">{tab.lead}</p>
          </header>
        ) : (
          <div className="py-10">
            <h1 className="sr-only">Sección no encontrada</h1>
            <EmptyState
              icon={Compass}
              title="Esta sección no existe"
              description="El enlace apunta a una pestaña que la consola no reconoce."
              action={
                <Link href="/admin/dashboard" className={buttonClass("secondary", "sm")}>
                  Ir al resumen
                </Link>
              }
            />
          </div>
        )}

        {/* Tab Content Container */}
        <div className="w-full">{children}</div>
      </main>
    </div>
  </div>
  );
}
// creado por pato dev y askforvini
