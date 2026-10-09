import type { Metadata } from "next";
import { cache } from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, Cake, Clock3, Gift, QrCode, Smartphone, Sparkles, UserPlus } from "@/components/icons";
import { prisma } from "@/lib/prisma";
import { programView } from "@/lib/business/loyalty/service";
import { AppPage } from "@/components/app-shell/AppPage";
import { LoyaltyCard } from "@/components/business/loyalty/LoyaltyCard";
import { JoinForm } from "@/components/business/loyalty/public/JoinForm";
import { BenefitChips, RewardsList } from "@/components/business/loyalty/public/Rewards";
import { dealLine, firstName, mainReward, publicProgram, units } from "@/components/business/loyalty/public/format";
import { cardCookieName, cardPath, findProgramCard, loadPublicProgram } from "@/app/api/loyalty/_lib/server";

export const dynamic = "force-dynamic";

const getProgram = cache(loadPublicProgram);

type Params = { slug: string };
type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const robots = { index: false, follow: false };
  const program = await getProgram(params.slug);
  if (!program) return { title: "Club no encontrado", robots };
  const pub = publicProgram(programView(program));
  return { title: `${pub.name} · ${pub.businessName}`, description: dealLine(pub), robots };
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]">{children}</h2>;
}

export default async function JoinPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const program = await getProgram(params.slug);
  if (!program) notFound();
  const view = programView(program);
  const pub = publicProgram(view);
  const reward = mainReward(pub.type, pub.rules, pub.rewards);

  const next = one(searchParams.next) === "sellar" ? ("sellar" as const) : null;
  const rawCode = one(searchParams.code);
  const code = rawCode && /^\d{6}$/.test(rawCode) ? rawCode : null;
  const rawRef = one(searchParams.ref);
  const ref = rawRef && /^[A-Za-z0-9]{4,12}$/.test(rawRef) ? rawRef.toUpperCase() : null;

  const existing = await findProgramCard(program.id, cookies().get(cardCookieName(program.id))?.value);
  // Vuelta de crear la cuenta o entrar desde la tarjeta: la tarjeta sale de la cookie (el serial nunca va en el login).
  if (one(searchParams.vincular) === "1" && existing) redirect(`${cardPath(pub.slug, existing.serial)}#account-title`);
  const inviter =
    ref && !existing
      ? await prisma.loyaltyCard.findFirst({ where: { programId: program.id, referralCode: ref, status: "ACTIVE" }, select: { customerName: true } })
      : null;
  const open = program.status === "ACTIVE";

  const perks = [
    pub.rules.welcomeBonus > 0 ? { icon: Sparkles, text: `Te regalamos ${units(pub.type, pub.rules.welcomeBonus)} de bienvenida.` } : null,
    pub.rules.birthdayBonus > 0 ? { icon: Cake, text: `En tu cumpleaños te regalamos ${units(pub.type, pub.rules.birthdayBonus)}.` } : null,
    pub.rules.referralBonus > 0 ? { icon: UserPlus, text: `Invitá amigos y ganá ${units(pub.type, pub.rules.referralBonus)} por cada uno.` } : null,
    pub.rules.expiresDays ? { icon: Clock3, text: `Tu saldo vence si pasan ${pub.rules.expiresDays} días sin que vuelvas.` } : null,
  ].filter((p): p is { icon: typeof Sparkles; text: string } => !!p);

  return (
    <AppPage kicker={pub.businessName} title={pub.name} lead={dealLine(pub)}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start lg:gap-12">
        <div className="flex flex-col items-center gap-3 lg:col-start-1 lg:row-start-1">
          <LoyaltyCard
            design={pub.design}
            type={pub.type}
            stampsGoal={pub.rules.stampsGoal}
            rewardName={reward?.name ?? null}
            pointsGoal={pub.type === "POINTS" ? reward?.cost ?? null : null}
            balance={0}
            side="flip"
            size="lg"
          />
          <p className="text-xs text-[var(--text-tertiary)]">Tocá la tarjeta para darla vuelta</p>
        </div>

        <section aria-labelledby="join-title" className="mv-panel flex flex-col gap-5 p-5 sm:p-6 lg:sticky lg:top-28 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          {existing ? (
            <>
              <div className="flex flex-col gap-2">
                <h2 id="join-title" className="font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                  Ya tenés tu tarjeta
                </h2>
                <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
                  Hola, {firstName(existing.customerName)}. Tu tarjeta de {pub.businessName} ya está guardada en este celular.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {next === "sellar" && code && open ? (
                  <Link href={`/c/${pub.slug}/sellar?code=${code}`} className="mv-btn mv-btn-primary mv-btn-lg w-full">
                    Sumar mi sello
                  </Link>
                ) : null}
                <Link href={cardPath(pub.slug, existing.serial)} className={`mv-btn mv-btn-lg w-full ${next === "sellar" && code && open ? "mv-btn-secondary" : "mv-btn-primary"}`}>
                  Ver mi tarjeta
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </>
          ) : !open ? (
            <div className="flex flex-col gap-2">
              <h2 id="join-title" className="font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                {program.status === "PAUSED" ? "El club está en pausa" : "Todavía no arrancó"}
              </h2>
              <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
                {pub.businessName} todavía no está recibiendo clientes en este club. Volvé a probar en unos días.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {inviter ? (
                  <span className="mv-chip mv-chip-gold w-fit">
                    <UserPlus className="h-3.5 w-3.5" aria-hidden />
                    {firstName(inviter.customerName)} te invitó
                  </span>
                ) : null}
                <h2 id="join-title" className="font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                  Sumate gratis
                </h2>
                <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
                  {next === "sellar" ? "Creá tu tarjeta en un minuto y sumamos tu sello de hoy." : "Creá tu tarjeta en un minuto. No necesitás app."}
                </p>
              </div>
              <JoinForm
                slug={pub.slug}
                businessName={pub.businessName}
                type={pub.type}
                birthdayBonus={pub.rules.birthdayBonus}
                refCode={ref}
                next={next}
                code={code}
              />
            </>
          )}
        </section>

        <div className="flex flex-col gap-8 lg:col-start-1 lg:row-start-2">
          {pub.rewards.length ? (
            <section className="flex flex-col gap-3" aria-label="Premios">
              <SectionTitle>Premios</SectionTitle>
              <RewardsList rewards={pub.rewards} type={pub.type} />
            </section>
          ) : null}

          {pub.design.benefits.length || perks.length ? (
            <section className="flex flex-col gap-3" aria-label="Beneficios">
              <SectionTitle>Beneficios</SectionTitle>
              <BenefitChips benefits={pub.design.benefits} />
              {perks.length ? (
                <ul className="mt-1 flex flex-col gap-2.5">
                  {perks.map(({ icon: Icon, text }) => (
                    <li key={text} className="flex items-start gap-3 text-[15px] leading-snug text-[var(--text-secondary)]">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                      {text}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ) : null}

          <section className="flex flex-col gap-3" aria-label="Cómo funciona">
            <SectionTitle>Cómo funciona</SectionTitle>
            <ol className="grid gap-2 sm:grid-cols-3">
              {[
                { icon: Smartphone, title: "Creá tu tarjeta", text: "Queda en tu celular, sin app." },
                { icon: QrCode, title: "Mostrala en caja", text: pub.type === "STAMPS" ? "Te suman un sello en cada visita." : "Sumás puntos con cada compra." },
                { icon: Gift, title: "Canjeá premios", text: "Cuando llegás, lo pedís en caja." },
              ].map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="mv-panel flex items-start gap-3 rounded-2xl p-4 sm:flex-col">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--mv-gold-wash)] text-gold" aria-hidden>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      <span className="sr-only">Paso {i + 1}: </span>
                      {title}
                    </p>
                    <p className="text-[13px] leading-snug text-[var(--text-secondary)]">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </AppPage>
  );
}
// creado por pato dev y askforvini
