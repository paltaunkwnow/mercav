import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, QrCode, Store, UserPlus } from "@/components/icons";
import { cardView, programView } from "@/lib/business/loyalty/service";
import { AppPage } from "@/components/app-shell/AppPage";
import { SelfStamp } from "@/components/business/loyalty/public/SelfStamp";
import { publicProgram } from "@/components/business/loyalty/public/format";
import { KIOSK_CODE_RE, cardCookieName, cardPath, findProgramCard, loadPublicProgram } from "@/app/api/loyalty/_lib/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sumar sello", robots: { index: false, follow: false }, referrer: "same-origin" };

function Message({ icon: Icon, title, children, actions }: { icon: typeof QrCode; title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mv-panel mx-auto flex w-full max-w-md flex-col items-center gap-4 p-6 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--mv-gold-wash)] text-gold" aria-hidden>
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{title}</h2>
      <div className="text-[15px] leading-relaxed text-[var(--text-secondary)]">{children}</div>
      {actions ? <div className="flex w-full flex-col gap-2">{actions}</div> : null}
    </div>
  );
}

/** QR del mostrador: /c/<slug>/sellar?code=123456. Suma 1 sello a la tarjeta guardada en este celular. */
export default async function SelfStampPage({ params, searchParams }: { params: { slug: string }; searchParams: Record<string, string | string[] | undefined> }) {
  const program = await loadPublicProgram(params.slug);
  if (!program) notFound();
  const view = programView(program);
  const pub = publicProgram(view);

  const raw = Array.isArray(searchParams.code) ? searchParams.code[0] : searchParams.code;
  const code = raw && KIOSK_CODE_RE.test(raw) ? raw : null;
  const card = await findProgramCard(program.id, cookies().get(cardCookieName(program.id))?.value);
  const cardUrl = card ? cardPath(pub.slug, card.serial) : null;
  const joinUrl = `/c/${pub.slug}?next=sellar${code ? `&code=${code}` : ""}`;

  let body: React.ReactNode;
  if (program.status !== "ACTIVE") {
    body = (
      <Message icon={Store} title="El club está en pausa">
        {pub.businessName} no está sumando sellos por ahora. Volvé a probar en unos días.
      </Message>
    );
  } else if (!view.rules.selfService || view.type !== "STAMPS") {
    body = (
      <Message
        icon={Store}
        title="Pedí tu sello en caja"
        actions={cardUrl ? <Link href={cardUrl} className="mv-btn mv-btn-primary mv-btn-lg w-full">Ver mi tarjeta</Link> : null}
      >
        En {pub.businessName} te suman {view.type === "STAMPS" ? "los sellos" : "los puntos"} en caja: mostrá el código de tu tarjeta.
      </Message>
    );
  } else if (!card) {
    body = (
      <Message
        icon={UserPlus}
        title="Primero sumate al club"
        actions={
          <Link href={joinUrl} className="mv-btn mv-btn-primary mv-btn-lg w-full">
            Crear mi tarjeta
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        }
      >
        Es gratis y lleva un minuto. Apenas la creás, sumamos tu sello de hoy.
      </Message>
    );
  } else if (!code) {
    body = (
      <Message icon={QrCode} title="Escaneá el QR del mostrador" actions={<Link href={cardPath(pub.slug, card.serial)} className="mv-btn mv-btn-secondary mv-btn-lg w-full">Ver mi tarjeta</Link>}>
        Para sumar tu sello, escaneá con la cámara el código que está en la caja de {pub.businessName}.
      </Message>
    );
  } else {
    body = <SelfStamp program={pub} initialCard={cardView(card, view)} code={code} cardUrl={cardPath(pub.slug, card.serial)} joinUrl={joinUrl} />;
  }

  return (
    <AppPage kicker={pub.businessName} title={pub.name} width="narrow">
      <div className="mx-auto w-full max-w-xl">{body}</div>
    </AppPage>
  );
}
// creado por pato dev y askforvini
