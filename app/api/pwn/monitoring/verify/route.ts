import { NextResponse } from "next/server";
import { disabledResponse, getPwnSessionUser, unauthorized } from "../../_lib/http";

export async function POST() {
  const disabled = disabledResponse();
  if (disabled) return disabled;
  const user = await getPwnSessionUser();
  if (!user) return unauthorized();
  return NextResponse.json(
    {
      success: false,
      error:
        "Ya no hace falta verificar pertenencia para consultar. Usa Exposición. Un administrador solo autoriza el patrullaje de un correo distinto al de tu cuenta.",
    },
    { status: 409 },
  );
}
// creado por pato dev y askforvini
