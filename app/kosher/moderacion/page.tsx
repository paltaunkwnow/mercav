import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getKosherViewer, publicAuthorName } from "@/lib/kosher/server";
import { EDITABLE_FIELDS } from "@/lib/kosher/edits";
import { CHESED_KIND, EVENT_KIND, MEALS, PLACE_TYPES, STATUS } from "@/lib/kosher/labels";
import { ModerationQueue, type QueueItem } from "@/components/kosher/ModerationQueue";

export const metadata: Metadata = { title: "Moderación" };

function show(field: string, value: string | null) {
  if (value == null || value === "") return "—";
  if (field === "status") return STATUS[value as keyof typeof STATUS] ?? value;
  return value;
}

export default async function KosherModerationPage() {
  const viewer = await getKosherViewer();
  if (!viewer?.isModerator) {
    return (
      <div className="mx-auto max-w-xl rounded-[2rem] border border-border bg-bg-secondary p-10 text-center">
        <h1 className="font-display text-2xl font-semibold text-[var(--text-primary)]">Moderación</h1>
        <p className="mt-3 text-[var(--text-secondary)]">Esta sección es para moderadores locales, agencias y el equipo de Mercav.</p>
      </div>
    );
  }

  const pending = { state: "pending" as const };
  const author = { select: { name: true } };
  const [places, edits, messages, events, hosts, chesed, claims] = await Promise.all([
    prisma.kosherPlace.findMany({ where: { published: false }, orderBy: { createdAt: "asc" }, include: { createdBy: { select: { name: true } } } }),
    prisma.kosherEditSuggestion.findMany({ where: { status: "pending" }, orderBy: { createdAt: "asc" }, include: { place: { select: { name: true, slug: true } } } }),
    prisma.kosherMessage.findMany({
      where: { hidden: true },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { name: true } }, _count: { select: { flags: true } } },
    }),
    prisma.kosherEvent.findMany({ where: pending, orderBy: { createdAt: "asc" }, include: { createdBy: author, place: { select: { name: true } } } }),
    prisma.kosherHost.findMany({ where: pending, orderBy: { updatedAt: "asc" }, include: { user: author } }),
    prisma.kosherChesed.findMany({ where: pending, orderBy: { createdAt: "asc" }, include: { createdBy: author } }),
    prisma.kosherClaim.findMany({
      where: pending,
      orderBy: { createdAt: "asc" },
      include: { user: { select: { name: true, email: true } }, place: { select: { name: true, slug: true, city: true } } },
    }),
  ]);

  const items: QueueItem[] = [
    ...places.map((p) => ({
      kind: "place" as const,
      id: p.id,
      title: p.name,
      meta: `${PLACE_TYPES[p.type]} · ${p.city}, ${p.country}`,
      detail: [p.address, p.agencyName ? `Agencia: ${p.agencyName}` : null, p.notes].filter(Boolean).join(" · "),
      by: p.createdBy ? publicAuthorName(p.createdBy.name) : "—",
      at: p.createdAt.toISOString(),
    })),
    ...edits.map((e) => ({
      kind: "edit" as const,
      id: e.id,
      title: e.place.name,
      meta: EDITABLE_FIELDS[e.field as keyof typeof EDITABLE_FIELDS]?.label ?? e.field,
      detail: `${show(e.field, e.oldValue)} → ${show(e.field, e.newValue)}${e.note ? ` · “${e.note}”` : ""}`,
      by: e.authorName,
      at: e.createdAt.toISOString(),
    })),
    ...messages.map((m) => ({
      kind: "message" as const,
      id: m.id,
      title: `Mensaje en ${m.threadKey.replace(/^(city|place):/, "")}`,
      meta: `${m._count.flags} ${m._count.flags === 1 ? "reporte" : "reportes"}`,
      detail: m.body,
      by: publicAuthorName(m.user.name),
      at: m.createdAt.toISOString(),
    })),
    ...events.map((e) => ({
      kind: "event" as const,
      id: e.id,
      title: e.title,
      meta: `${EVENT_KIND[e.kind]} · ${e.city} · ${e.startsAt.toISOString().slice(0, 16).replace("T", " ")} UTC${e.place ? ` · ${e.place.name}` : ""}`,
      detail: e.body ?? "",
      by: publicAuthorName(e.createdBy.name),
      at: e.createdAt.toISOString(),
    })),
    ...hosts.map((h) => ({
      kind: "host" as const,
      id: h.id,
      title: `Mesa de ${publicAuthorName(h.user.name)}`,
      meta: `${h.city} · hasta ${h.capacity} · ${h.meals.map((m) => MEALS[m as keyof typeof MEALS] ?? m).join(", ")}`,
      detail: `Kashrut: ${h.kashrut}\n${h.about}`,
      by: publicAuthorName(h.user.name),
      at: h.updatedAt.toISOString(),
    })),
    ...chesed.map((c) => ({
      kind: "chesed" as const,
      id: c.id,
      title: c.title,
      meta: `${CHESED_KIND[c.kind]} · ${c.city}`,
      detail: [c.body, c.contact ? `Contacto: ${c.contact}` : null].filter(Boolean).join("\n"),
      by: publicAuthorName(c.createdBy.name),
      at: c.createdAt.toISOString(),
    })),
    ...claims.map((c) => ({
      kind: c.kind,
      id: c.id,
      title: c.place.name,
      meta: `${c.contactName} · ${c.contactRole}${c.contactPhone ? ` · ${c.contactPhone}` : ""} · ${c.user.email}`,
      detail: [
        c.kind === "certificate" ? `Agencia: ${c.agencyName} · vence ${c.certExpiresAt?.toISOString().slice(0, 10)}` : null,
        c.evidence,
      ]
        .filter(Boolean)
        .join("\n"),
      by: publicAuthorName(c.user.name),
      at: c.createdAt.toISOString(),
      link: c.certificateUrl ? { href: c.certificateUrl, label: "Ver certificado" } : { href: `/kosher/lugar/${c.place.slug}`, label: "Ver ficha" },
    })),
  ];

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-[var(--text-primary)]">Moderación</h1>
        <p className="mt-3 text-[var(--text-secondary)]">
          Aprobá lo que tenga fuente. En disputas, marcá el estado como “En disputa”: la app no decide quién tiene razón. Para
          administración de fichas y certificados, confirmá por teléfono o correo institucional antes de aprobar.
        </p>
      </header>
      <ModerationQueue items={items} />
    </div>
  );
}
