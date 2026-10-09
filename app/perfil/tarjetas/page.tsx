import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BadgeCheck, CreditCard, ShieldAlert } from "@/components/icons";
import { AppPage } from "@/components/app-shell/AppPage";
import { LoyaltyCard } from "@/components/business/loyalty/LoyaltyCard";
import { cardVisualProps, publicProgram } from "@/components/business/loyalty/public/format";
import { sessionUserId } from "@/lib/calendar/server";
import { prisma } from "@/lib/prisma";
import { cardView, programInclude, programView } from "@/lib/business/loyalty/service";
import { ensureClubCode } from "@/lib/business/loyalty/club";
import { REAL_DATA_NOTICE_CUSTOMER } from "@/lib/business/loyalty/notice";
import { cardPath } from "@/app/api/loyalty/_lib/server";

export const metadata: Metadata = { title: "Mis tarjetas", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Las tarjetas de fidelización de cada negocio, guardadas en la cuenta, y el código MercavClub para que un negocio
 * encuentre la cuenta o le registre una tarjeta. El middleware deja pasar /perfil/<algo> (perfiles públicos): la
 * sesión se exige acá.
 */
export default async function MisTarjetas() {
  const userId = await sessionUserId();
  if (!userId) redirect("/login?callbackUrl=/perfil/tarjetas");

  const [clubCode, cards] = await Promise.all([
    ensureClubCode(userId),
    prisma.loyaltyCard.findMany({
      where: { userId },
      include: { program: { include: programInclude } },
      orderBy: [{ lastVisitAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <AppPage
      title="Mis tarjetas"
      lead="Tus tarjetas de cliente frecuente, de cada negocio, en un solo lugar."
      back={{ href: "/perfil", label: "Mi perfil" }}
      width="narrow"
    >
      <div className="flex flex-col gap-6">
        <section aria-labelledby="club-title" className="flex flex-col gap-3 rounded-[1.25rem] border border-gold/40 bg-[var(--mv-panel-sunk)] p-5">
          <h2 id="club-title" className="mv-kicker">
            Tu código MercavClub
          </h2>
          {clubCode ? (
            <p className="mv-data select-all text-[1.6rem] font-semibold tracking-[0.08em] text-[var(--text-primary)] sm:text-[1.9rem]">{clubCode}</p>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">No pudimos crear tu código. Recargá la página.</p>
          )}
          <p className="text-sm text-[var(--text-secondary)]">
            Dictalo en caja para que el negocio te encuentre o te cree la tarjeta: queda guardada acá automáticamente.
          </p>
          <p className="rounded-[1rem] bg-[var(--mv-gold-wash)] p-3 text-sm text-[var(--text-primary)]">{REAL_DATA_NOTICE_CUSTOMER}</p>
        </section>

        {cards.length ? (
          <ul className="flex flex-col gap-4" aria-label="Tus tarjetas">
            {cards.map((c) => {
              const view = programView(c.program);
              const pub = publicProgram(view);
              const card = cardView(c, view);
              return (
                <li key={c.id} className="mv-panel flex flex-col gap-4 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                    <div className="min-w-0">
                      <p className="text-[1.05rem] font-semibold text-[var(--text-primary)]">{pub.businessName}</p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {view.name} · Cliente #{card.customerNo}
                      </p>
                    </div>
                    {card.holderStatus === "VERIFIED" ? (
                      <span className="mv-chip mv-chip-gold shrink-0">
                        <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                        Titular verificado
                      </span>
                    ) : (
                      <span className="mv-chip shrink-0">
                        <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
                        Falta tu documento
                      </span>
                    )}
                  </div>
                  <LoyaltyCard {...cardVisualProps(pub, card)} />
                  <p className="text-[0.95rem] text-[var(--text-primary)]">{card.progress.label}</p>
                  {card.holderStatus !== "VERIFIED" ? (
                    <p className="text-sm text-[var(--text-secondary)]">En tu próxima visita, mostrá tu documento en {pub.businessName} para validar que sos el titular.</p>
                  ) : null}
                  <Link href={cardPath(view.slug, c.serial)} className="mv-btn mv-btn-secondary mv-focus w-full sm:w-fit">
                    Abrir tarjeta
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mv-panel flex flex-col items-start gap-3 p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--mv-gold-wash)] text-[var(--mv-gold-ink)]">
              <CreditCard className="h-5 w-5" aria-hidden />
            </span>
            <p className="text-[1.05rem] font-semibold text-[var(--text-primary)]">Todavía no guardaste tarjetas</p>
            <p className="text-sm text-[var(--text-secondary)]">
              Abrí tu tarjeta de un negocio y tocá «Guardar en mi cuenta», o dictá tu código MercavClub en caja.
            </p>
          </div>
        )}
      </div>
    </AppPage>
  );
}
// creado por pato dev y askforvini
