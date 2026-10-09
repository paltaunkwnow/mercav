import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { ArrowRight, BadgeCheck, Megaphone, ScanLine, ShieldAlert, Smartphone, Sun, UserRound } from "@/components/icons";
import { sessionUserId } from "@/lib/calendar/server";
import { LinkCardForm } from "@/components/business/loyalty/public/LinkCardForm";
import { REAL_DATA_NOTICE_CUSTOMER } from "@/lib/business/loyalty/notice";
import { cardHistory, cardView, programView, refreshCard } from "@/lib/business/loyalty/service";
import { resolveBusiness } from "@/lib/business/context";
import { AppPage } from "@/components/app-shell/AppPage";
import { CardLive } from "@/components/business/loyalty/public/CardLive";
import { ActivityList } from "@/components/business/loyalty/public/ActivityList";
import { InviteFriends } from "@/components/business/loyalty/public/InviteFriends";
import { WalletButtons } from "@/components/business/loyalty/public/WalletButtons";
import { firstName, groupSerial, publicProgram, timeZoneFor, whenText } from "@/components/business/loyalty/public/format";
import { cardPath, latestCampaignFor, loadCardForSlug, pageOrigin } from "@/app/api/loyalty/_lib/server";

export const dynamic = "force-dynamic";

const getCard = cache((slug: string, serial: string) => loadCardForSlug(slug, serial.toUpperCase()));

type Params = { slug: string; serial: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const card = await getCard(params.slug, params.serial);
  const base: Metadata = { robots: { index: false, follow: false }, referrer: "same-origin" };
  if (!card) return { ...base, title: "Tarjeta no encontrada" };
  const pub = publicProgram(programView(card.program));
  return { ...base, title: `Tu tarjeta · ${pub.businessName}` };
}

function Panel({ title, icon: Icon, children, id }: { title: string; icon: typeof Megaphone; children: React.ReactNode; id: string }) {
  return (
    <section aria-labelledby={id} className="mv-panel flex flex-col gap-3 p-5">
      <h2 id={id} className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]">
        <Icon className="h-4 w-4 text-gold" aria-hidden />
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function CardPage({ params }: { params: Params }) {
  const loaded = await getCard(params.slug, params.serial);
  if (!loaded) notFound();
  const program = loaded.program;
  const now = new Date();

  // Vencimiento y regalo de cumpleaños pendientes, antes de mostrar nada.
  const fresh = await refreshCard(loaded.id, program, now);
  const view = programView(program);
  const pub = publicProgram(view);
  const card = cardView(fresh, view, now);
  const timeZone = timeZoneFor(pub.country);

  const origin = pageOrigin();
  const cardUrl = `${origin}${cardPath(view.slug, fresh.serial)}`;
  const inviteUrl = `${origin}/c/${view.slug}?ref=${fresh.referralCode}`;

  const [history, campaign, qrSvg, staff, me] = await Promise.all([
    cardHistory(fresh.id, 10),
    latestCampaignFor(program.id, fresh, view, now),
    QRCode.toString(cardUrl, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#0b0b0cff", light: "#ffffffff" } }),
    resolveBusiness(view.workspace.slug).catch(() => null),
    sessionUserId().catch(() => null),
  ]);
  // La tarjeta y la cuenta Mercav: guardarla, ver si está validada o avisar si quedó en otra cuenta.
  const account = fresh.userId ? (fresh.userId === me ? "mine" : "other") : me ? "link" : "signedOut";
  const back = encodeURIComponent(`/c/${view.slug}?vincular=1`);
  // Alguien del equipo que abre la tarjeta (por ejemplo, escaneándola con la cámara del iPhone) va directo a sellarla.
  const isStaff = !!staff && staff.ok && staff.ctx.can("loyalty.stamp");

  return (
    <AppPage kicker={pub.businessName} title={`Hola, ${firstName(card.customerName)}`} width="narrow">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        {isStaff ? (
          <div className="mv-panel flex flex-col gap-3 border-[var(--color-border-gold)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm leading-snug text-[var(--text-secondary)]">
              Sos parte del equipo de <span className="font-semibold text-[var(--text-primary)]">{view.workspace.name}</span>.
            </p>
            <Link href={`/business/${view.workspace.slug}/sellar?card=${fresh.serial}`} className="mv-btn mv-btn-primary mv-btn-sm shrink-0">
              Sellar esta tarjeta
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : null}

        {program.status !== "ACTIVE" ? (
          <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-relaxed text-[var(--text-primary)]">
            {program.status === "ARCHIVED"
              ? `${pub.businessName} cerró este club. Consultá en el local por tus premios.`
              : `${pub.businessName} pausó el club por ahora. Tu saldo sigue guardado.`}
          </p>
        ) : null}

        <CardLive
          program={pub}
          initialCard={card}
          remember={!isStaff}
          afterCard={
            <>
              <section aria-labelledby="qr-title" className="mv-panel flex flex-col items-center gap-4 p-5 text-center sm:p-6">
                <h2 id="qr-title" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                  <ScanLine className="h-4 w-4 text-gold" aria-hidden />
                  Mostrá este código en caja
                </h2>
                <div
                  role="img"
                  aria-label="Código QR de tu tarjeta"
                  className="aspect-square w-[min(15rem,70vw)] rounded-[1.25rem] bg-white p-4 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] [&>svg]:h-full [&>svg]:w-full"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
                <div className="flex flex-col items-center gap-1">
                  <p className="text-xs font-medium text-[var(--text-tertiary)]">Si no lo pueden escanear, dictá este código</p>
                  <p className="mv-data select-all text-[15px] font-semibold tracking-[0.14em] text-[var(--text-primary)] sm:text-base">{groupSerial(fresh.serial)}</p>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                  <Sun className="h-3.5 w-3.5" aria-hidden />
                  Subí el brillo si cuesta leerlo
                </p>
              </section>

              {campaign ? (
                <Panel title={`Mensaje de ${pub.businessName}`} icon={Megaphone} id="campaign-title">
                  <div className="flex flex-col gap-1">
                    <p className="text-[15px] font-semibold text-[var(--text-primary)]">{campaign.title}</p>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--text-secondary)]">{campaign.body}</p>
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)]">{whenText(campaign.createdAt, timeZone, now)}</p>
                </Panel>
              ) : null}
            </>
          }
        >
          {pub.rules.referralBonus > 0 && program.status === "ACTIVE" ? (
            <InviteFriends url={inviteUrl} bonus={pub.rules.referralBonus} type={pub.type} businessName={pub.businessName} />
          ) : null}

          <section aria-labelledby="activity-title" className="mv-panel flex flex-col gap-1 p-5">
            <h2 id="activity-title" className="font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              Actividad
            </h2>
            <ActivityList events={history} type={pub.type} timeZone={timeZone} now={now} />
          </section>

          {!isStaff ? (
            <Panel title="Tu cuenta Mercav" icon={UserRound} id="account-title">
              {account === "mine" ? (
                fresh.holderStatus === "VERIFIED" ? (
                  <p className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--mv-gold-ink)]" aria-hidden />
                    Guardada en tu cuenta y validada: sos el titular.
                  </p>
                ) : (
                  <p className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--mv-gold-ink)]" aria-hidden />
                    Guardada en tu cuenta. En tu próxima visita, mostrá tu documento en {pub.businessName} para validar que sos el titular.
                  </p>
                )
              ) : account === "other" ? (
                <p className="text-sm text-[var(--text-secondary)]">Esta tarjeta ya está guardada en una cuenta Mercav. Si no fuiste vos, avisá en {pub.businessName}.</p>
              ) : account === "link" ? (
                <>
                  <p className="text-sm text-[var(--text-secondary)]">Guardala en tu cuenta y mirá todas tus tarjetas, de cada negocio, desde Mercav.</p>
                  <LinkCardForm slug={view.slug} needsPhone={!!fresh.phone} businessName={pub.businessName} />
                </>
              ) : (
                <>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Creá tu cuenta gratis y guardá esta tarjeta: vas a ver todas tus tarjetas, de cada negocio, en un solo lugar.
                  </p>
                  <p className="rounded-[1rem] bg-[var(--mv-gold-wash)] p-3 text-sm text-[var(--text-primary)]">{REAL_DATA_NOTICE_CUSTOMER.replace("el negocio", pub.businessName)}</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link href={`/register?callbackUrl=${back}`} className="mv-btn mv-btn-primary">
                      Crear mi cuenta
                    </Link>
                    <Link href={`/login?callbackUrl=${back}`} className="mv-btn mv-btn-secondary">
                      Ya tengo cuenta
                    </Link>
                  </div>
                </>
              )}
              {account === "mine" ? (
                <Link href="/perfil/tarjetas" className="mv-link inline-flex w-fit items-center gap-1.5 text-sm">
                  Ver mis tarjetas <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : null}
            </Panel>
          ) : null}

          <section aria-labelledby="save-title" className="flex flex-col gap-3">
            <h2 id="save-title" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              <Smartphone className="h-4 w-4 text-gold" aria-hidden />
              Guardá esta página
            </h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Es tu tarjeta: agregala a la pantalla de inicio para tenerla a mano. En iPhone, tocá Compartir y «Agregar a inicio». En Android, abrí el menú
              del navegador y elegí «Agregar a la pantalla principal».
            </p>
            <WalletButtons appleUrl={null} googleUrl={null} className="sm:grid-cols-1" />
            <p className="text-xs leading-relaxed text-[var(--text-tertiary)]">
              No compartas este link: es tu tarjeta. ¿Querés borrarla? Pedile a {pub.businessName} que la borre.
            </p>
          </section>
        </CardLive>
      </div>
    </AppPage>
  );
}
// creado por pato dev y askforvini
