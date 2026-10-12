import { Noto_Serif_Hebrew } from "next/font/google";

/**
 * Letra para el hebreo con nikud. La del sistema no siempre ubica bien los puntos (sobre todo en Android y Windows);
 * Noto Serif Hebrew los dibuja completos. Solo el subset hebreo: el resto de la página sigue con la letra de Mercav.
 */
export const hebrewSerif = Noto_Serif_Hebrew({ subsets: ["hebrew"], display: "swap" });
// creado por pato dev y askforvini
