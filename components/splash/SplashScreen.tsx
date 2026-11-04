import type { MerviPose } from "@/components/mervi/Mervi";
import { cn } from "@/lib/utils";
import { CyclingLines, MerviStage, SplashProgress } from "./LoadingAnimation";

/**
 * Pantalla de carga de Mercav: Mervi turnando poses sobre un fondo líquido dorado y azul noche, dentro de una tarjeta
 * de vidrio, con barra de progreso y mensajes según el contexto.
 *
 * Sin hooks ni "use client": sirve en loading.tsx, en fallbacks de Suspense (servidor o cliente) y como capa encima
 * de un formulario. Sigue el tema (.light en <html>) y respeta "reducir movimiento" y "reducir transparencia".
 *
 *   <SplashScreen />                         // carga de la app, en línea dentro del <main>
 *   <SplashScreen variant="business" />      // páginas de un negocio
 *   <SplashScreen variant="welcome" fullscreen />  // tapa toda la pantalla
 */
export const SPLASH_VARIANTS = {
  app: {
    kicker: "Mercav",
    title: "Preparando tu negocio",
    lines: ["Cargando Mercav…", "Acomodando la vitrina…", "Mervi está abriendo la tienda…"],
    poses: ["saludando", "emprendedor", "celebrando"],
    progress: "Cargando Mercav",
  },
  business: {
    kicker: "Tu negocio",
    title: "Preparando tu negocio",
    lines: ["Abriendo la caja…", "Contando el inventario…", "Poniendo al día las planillas…"],
    poses: ["emprendedor", "programador", "normal"],
    progress: "Cargando tu negocio",
  },
  data: {
    kicker: "Un momento",
    title: "Trayendo tus datos",
    lines: ["Buscando la información…", "Ordenando los números…", "Ya casi está…"],
    poses: ["pensativo", "libro", "programador"],
    progress: "Cargando datos",
  },
  login: {
    kicker: "Iniciar sesión",
    title: "Abriendo la puerta",
    lines: ["Preparando el ingreso…", "Revisando la seguridad…", "Ya casi…"],
    poses: ["saludando", "smartphone", "cool"],
    progress: "Conectando",
  },
  welcome: {
    kicker: "Sesión iniciada",
    title: "¡Bienvenido de nuevo!",
    lines: ["Verificando tu cuenta…", "Abriendo tu espacio…", "Preparando tu negocio…"],
    poses: ["celebrando", "cool", "emprendedor"],
    progress: "Entrando a Mercav",
  },
} as const satisfies Record<
  string,
  {
    kicker: string;
    title: string;
    lines: readonly [string, string, string];
    poses: readonly [MerviPose, MerviPose, MerviPose];
    progress: string;
  }
>;

export type SplashVariant = keyof typeof SPLASH_VARIANTS;

export function SplashScreen({
  variant = "app",
  fullscreen = false,
  title,
  className,
}: {
  variant?: SplashVariant;
  /** Fija y encima de todo (también del header). Sin esto, ocupa el área de contenido. */
  fullscreen?: boolean;
  /** Pisa el titular de la variante. */
  title?: string;
  className?: string;
}) {
  const v = SPLASH_VARIANTS[variant];
  const heading = title ?? v.title;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn("cartel c-splash", fullscreen ? "c-splash-full" : "c-splash-inline", className)}
    >
      <span className="c-splash-blob c-splash-blob-a" aria-hidden />
      <span className="c-splash-blob c-splash-blob-b" aria-hidden />
      <span className="c-splash-blob c-splash-blob-c" aria-hidden />

      <span className="sr-only">
        {heading}. {v.lines[0]}
      </span>

      <div className="c-splash-card">
        <MerviStage poses={v.poses} />

        <p className="c-label mt-3 text-[0.8125rem] tracking-[0.2em] text-[var(--c-splash-gold-text)]" aria-hidden>
          {v.kicker}
        </p>
        <h2 className="c-display mt-2 text-balance text-[clamp(2.25rem,1.8rem+2vw,3rem)]" aria-hidden>
          {heading}
        </h2>
        <CyclingLines lines={v.lines} className="c-lead mt-3 min-h-[1.5em] text-[1rem] sm:text-[1.0625rem]" />

        <div className="mt-7 w-full">
          <SplashProgress label={v.progress} />
        </div>
      </div>
    </div>
  );
}
// creado por pato dev y askforvini
