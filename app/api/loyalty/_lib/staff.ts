import { cardHistory, cardView, programView, refreshCard } from "@/lib/business/loyalty/service";
import type { LoyaltyCardView, LoyaltyEventView, LoyaltyProgramView } from "@/lib/business/loyalty/types";
import type { LoyaltyCard } from "@prisma/client";
import type { ProgramFull } from "./server";

/** Lo que recibe la caja al abrir una tarjeta (sin celular ni correo del cliente). */
export type StaffCardPayload = { program: LoyaltyProgramView; card: LoyaltyCardView; history: LoyaltyEventView[] };

/** Aplica vencimiento y cumpleaños pendientes y arma la vista para la caja. */
export async function staffCardPayload(card: LoyaltyCard & { program: ProgramFull }): Promise<StaffCardPayload> {
  const fresh = await refreshCard(card.id, card.program);
  const program = programView(card.program);
  return { program, card: cardView(fresh, program), history: await cardHistory(card.id, 5) };
}

/** Lo que se tipea a mano suele confundir 0/O, 1/I y 8/B: el serial no usa esos dígitos. */
export function fixTypedSerial(raw: string) {
  if (raw.includes("/")) return raw;
  return raw.toUpperCase().replace(/0/g, "O").replace(/1/g, "I").replace(/8/g, "B");
}
// creado por pato dev y askforvini
