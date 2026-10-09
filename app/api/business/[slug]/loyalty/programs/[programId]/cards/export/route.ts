import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/business/audit";
import { latamCountry, todayIn } from "@/lib/geo/latam";
import { programView } from "@/lib/business/loyalty/service";
import { customerOrder, customerRow, customerSelect, customerWhere } from "@/lib/business/loyalty/stats";
import { CARD_FILTER_LABELS, cleanQuery, customerSheetRows, parseCardFilter } from "@/lib/business/loyalty/stats-core";
import { slugify } from "@/lib/business/slug";
import { apiProgram, fail } from "../../../_shared";

export const dynamic = "force-dynamic";

const MAX_ROWS = 50_000;

/** Excel de clientes con el mismo filtro y búsqueda que la lista. */
export async function GET(req: Request, { params }: { params: { slug: string; programId: string } }) {
  const found = await apiProgram(params.slug, params.programId, "loyalty.view");
  if ("error" in found) return found.error;
  const { ctx, program } = found;
  const view = programView(program);
  const url = new URL(req.url);
  const filter = parseCardFilter(url.searchParams.get("filter"));
  const query = cleanQuery(url.searchParams.get("q"));
  const now = new Date();
  const where = customerWhere(view, filter, query, now);
  const total = await prisma.loyaltyCard.count({ where });
  if (total > MAX_ROWS) return fail(`Son más de ${MAX_ROWS.toLocaleString("es")} clientes. Usá un filtro para exportar menos.`);
  const cards = await prisma.loyaltyCard.findMany({ where, select: customerSelect, orderBy: customerOrder });
  const tz = latamCountry(ctx.workspace.country).timezone;
  const today = todayIn(tz, now);

  const title = [`${ctx.workspace.name} — ${view.name}`];
  const subtitle = [`Clientes · ${CARD_FILTER_LABELS[filter]}${query ? ` · búsqueda "${query}"` : ""} · ${today}`];
  const note = ["Datos personales de tus clientes. Usalos solo para tu negocio y respetá a quien no aceptó recibir mensajes."];
  const sheet = XLSX.utils.aoa_to_sheet([title, subtitle, note, [], ...customerSheetRows(cards.map((c) => customerRow(c, view, now)), { type: view.type, timeZone: tz })]);
  sheet["!cols"] = [{ wch: 28 }, { wch: 16 }, { wch: 28 }, { wch: 14 }, { wch: 16 }, { wch: 9 }, { wch: 13 }, { wch: 14 }, { wch: 12 }, { wch: 15 }, { wch: 11 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Clientes");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  await audit(ctx.workspace.id, ctx.userId, "loyalty.cards.export", "LoyaltyProgram", program.id, { filter, query: query || null, rows: cards.length });
  const file = `clientes-${slugify(view.name)}-${today}.xlsx`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
// creado por pato dev y askforvini
