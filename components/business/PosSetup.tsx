import Link from "next/link";
import { BarChart3, ChevronLeft, Package, ShoppingCart, UserPlus } from "@/components/icons";
import { AdoptPosButton } from "@/components/business/AdoptPosButton";

/**
 * Alta de la caja de una empresa. La caja se abre a pantalla completa (sin el header de la app), así que esta
 * pantalla trae su propio camino de vuelta.
 */
export function PosSetup({
  slug,
  workspaceName,
  canConfigure,
  legacy,
}: {
  slug: string;
  workspaceName: string;
  canConfigure: boolean;
  legacy: { shopName: string | null; products: number; sales: number } | null;
}) {
  return (
    <main className="min-h-dvh bg-bg-primary px-4 pb-16 pt-[max(1.25rem,env(safe-area-inset-top,0px))]">
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        <Link
          href={`/business/${slug}`}
          className="mv-focus -ml-1 inline-flex min-h-11 w-fit items-center gap-1 rounded-full pr-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {workspaceName}
        </Link>

        <div className="flex flex-col gap-2">
          <h1 className="mv-h1">La caja de {workspaceName}</h1>
          <p className="mv-lead">
            Vendé desde el celular, la tablet o la compu, con o sin conexión. Tu equipo entra con su propia cuenta Mercav y cada uno ve lo que su rol permite.
          </p>
        </div>

        <ul className="mv-panel flex flex-col divide-y divide-[var(--mv-hairline)]">
          {[
            { icon: ShoppingCart, title: "Vender y cerrar la caja", body: "Trabajadores, encargados, RR.HH. y el dueño." },
            { icon: Package, title: "Inventario y anulaciones", body: "Encargados y el dueño." },
            { icon: BarChart3, title: "Reportes con costos y ganancia", body: "Encargados, el contador y el dueño." },
            { icon: UserPlus, title: "Sumar gente a la caja", body: "Invitalos desde Ajustes: quien entra como trabajador ya puede vender." },
          ].map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex items-start gap-3 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--mv-gold-wash)] text-[var(--mv-gold-ink)]">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[0.95rem] font-semibold text-[var(--text-primary)]">{title}</span>
                <span className="block text-sm text-[var(--text-secondary)]">{body}</span>
              </span>
            </li>
          ))}
        </ul>

        {canConfigure ? (
          <div className="flex flex-col gap-3">
            {legacy ? (
              <div className="mv-panel flex flex-col gap-3 p-5">
                <p className="mv-kicker">Tu caja anterior</p>
                <p className="text-[0.95rem] text-[var(--text-primary)]">
                  Tenés una caja anterior{legacy.shopName ? ` (${legacy.shopName})` : ""} con {legacy.products} {legacy.products === 1 ? "producto" : "productos"} y{" "}
                  {legacy.sales} {legacy.sales === 1 ? "venta" : "ventas"}. Traela a {workspaceName} y tu equipo la usa con sus cuentas.
                </p>
                <AdoptPosButton slug={slug} />
              </div>
            ) : null}
            <Link href={`/business/${slug}/caja/ajustes`} className={legacy ? "mv-btn mv-btn-secondary mv-focus" : "mv-btn mv-btn-primary mv-focus"}>
              {legacy ? "Empezar una caja nueva" : "Configurar la caja"}
            </Link>
          </div>
        ) : (
          <p className="mv-panel p-5 text-[0.95rem] text-[var(--text-secondary)]">
            La caja de esta empresa todavía no está activa. Pedile a quien administra {workspaceName} que la configure.
          </p>
        )}
      </div>
    </main>
  );
}
// creado por pato dev y askforvini
