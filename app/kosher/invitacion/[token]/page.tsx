import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getKosherViewer } from "@/lib/kosher/server";
import { PLACE_TYPES } from "@/lib/kosher/labels";
import { EmptyState, PageIntro, SignInCard, cardClass, primaryButton } from "@/components/kosher/ui";
import { InviteRedeemForm } from "@/components/kosher/CommunityForms";

export const metadata: Metadata = { title: "Invitación", robots: { index: false } };

export default async function KosherInvitePage({ params }: { params: { token: string } }) {
  const invite = await prisma.kosherInvite.findUnique({ where: { token: params.token } });
  const place = invite ? await prisma.kosherPlace.findUnique({ where: { id: invite.placeId }, select: { slug: true, name: true, type: true, city: true } }) : null;
  const viewer = await getKosherViewer();

  if (!invite || !place)
    return (
      <div className="mx-auto max-w-xl">
        <PageIntro eyebrow="Invitación" title="No encontramos esta invitación" />
        <EmptyState>Revisá que el enlace esté completo, o pedí uno nuevo al equipo de Mercav Kosher.</EmptyState>
      </div>
    );

  if (invite.usedAt) {
    const mine = viewer?.id === invite.usedById;
    return (
      <div className="mx-auto max-w-xl">
        <PageIntro eyebrow="Invitación" title={mine ? "Invitación aceptada" : "Invitación usada"} />
        <EmptyState>
          {mine ? "Ya aceptaste esta invitación." : "Esta invitación ya se usó. Pedí una nueva al equipo de Mercav Kosher."}
          {mine && (
            <span className="mt-5 block">
              <Link href={`/kosher/lugar/${place.slug}/administrar`} className={primaryButton}>
                Administrar {place.name}
              </Link>
            </span>
          )}
        </EmptyState>
      </div>
    );
  }
  if (invite.expiresAt < new Date())
    return (
      <div className="mx-auto max-w-xl">
        <PageIntro eyebrow="Invitación" title="Esta invitación venció" />
        <EmptyState>Pedí una nueva al equipo de Mercav Kosher.</EmptyState>
      </div>
    );

  return (
    <div className="mx-auto max-w-xl">
      <PageIntro eyebrow="Invitación" title={`Administrá ${place.name}`}>
        <p>
          El equipo de Mercav Kosher invitó a {place.name} ({PLACE_TYPES[place.type].toLowerCase()} en {place.city}) a gestionar su ficha oficial.
          Vas a poder actualizar la información, publicar en la agenda y cargar el certificado de kashrut.
        </p>
      </PageIntro>
      {viewer ? (
        <div className={cardClass}>
          <p className="mb-5 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <BadgeCheck className="h-4 w-4 text-techelet" aria-hidden /> Vas a aceptar como {viewer.name}.
          </p>
          <InviteRedeemForm token={params.token} slug={place.slug} />
        </div>
      ) : (
        <SignInCard callbackUrl={`/kosher/invitacion/${params.token}`}>Entrá o creá la cuenta Mercav de la institución para aceptar la invitación.</SignInCard>
      )}
    </div>
  );
}
