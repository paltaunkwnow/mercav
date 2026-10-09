import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * Mervi, la mascota oficial de Mercav: un gato tuxedo en pixel art sobre una grilla de 96 × 96, con hoodie negra,
 * cordones dorados, el isotipo de Mercav y una kippah negra con borde dorado.
 * Los sprites salen de scripts/mervi (python3 scripts/mervi/mervi.py) y viven en public/mervi:
 *   - public/mervi/<pose>.png: sprite oficial con fondo transparente (stickers, redes, notificaciones).
 *   - public/mervi/web/<pose>.png: tira de cuadros con borde blanco de sticker, para la web.
 *   - public/mervi/mervi-character-sheet.png: la hoja de personaje.
 * Se anima cuadro a cuadro (cola, saludo, festejo y parpadeo) y con "reducir movimiento" queda quieto.
 */
export const MERVI_POSES = {
  normal: { frames: 3, speed: 0.6 },
  saludando: { frames: 3, speed: 0.32 },
  celebrando: { frames: 2, speed: 0.3 },
  programador: { frames: 3, speed: 0.55 },
  smartphone: { frames: 3, speed: 0.6 },
  comunidad: { frames: 2, speed: 0.55 },
  pensativo: { frames: 3, speed: 0.6 },
  cool: { frames: 2, speed: 0.7 },
  sorprendido: { frames: 2, speed: 0.22 },
  durmiendo: { frames: 2, speed: 0.9 },
  libro: { frames: 3, speed: 0.7 },
  emprendedor: { frames: 3, speed: 0.5 },
} as const;

export type MerviPose = keyof typeof MERVI_POSES;

/** Lado del sprite (grilla lógica) en píxeles de pantalla con scale 1. */
export const MERVI_SIZE = 96;

export function Mervi({
  pose = "normal",
  scale = 1,
  scaleLg,
  label,
  still,
  className,
  style,
}: {
  pose?: MerviPose;
  /** Múltiplo entero del sprite (1 = 96 px, 2 = 192 px) para que los píxeles queden nítidos. */
  scale?: 1 | 2 | 3;
  /** Escala desde 1024 px de ancho (por defecto, la misma). */
  scaleLg?: 1 | 2 | 3;
  /** Texto para lectores de pantalla. Sin label, Mervi es decorativo. */
  label?: string;
  /** Sin animación. */
  still?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const { frames, speed } = MERVI_POSES[pose];
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("mervi", `mervi-f${frames}`, still && "mervi-still", className)}
      style={
        {
          "--mervi-u1": `${scale}px`,
          "--mervi-u2": `${scaleLg ?? scale}px`,
          "--mervi-speed": `${speed}s`,
          "--mervi-frames": frames,
          backgroundImage: `url(/mervi/web/${pose}.png)`,
          ...style,
        } as CSSProperties
      }
    />
  );
}
// creado por pato dev y askforvini
