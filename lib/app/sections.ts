import {
  Building2,
  Store,
  CalendarDays,
  MessageSquare,
  PlusSquare,
  Rss,
  Shield,
  User,
  Wrench,
  type LucideIcon,
} from "@/components/icons";
import { StarOfDavid } from "@/components/site/StarOfDavid";

/** Un apartado de app.mercav.lat. Fuente única para el inicio, el header y la barra inferior. */
export type AppSection = {
  key: string;
  label: string;
  /** Nombre de producto cuando lo tiene (Mercav Business, Mercav Pwn…). */
  product?: string;
  desc: string;
  href: string;
  icon: LucideIcon | typeof StarOfDavid;
  /** Necesita sesión para usarse (el resto también tiene vista pública). */
  needsAccount?: boolean;
  /** Otras rutas que son parte del apartado y lo resaltan en la navegación (el Mercado abarca tres catálogos). */
  also?: string[];
  isNew?: boolean;
};

export type AppSectionGroup = { key: string; title: string; sections: AppSection[] };

export const APP_SECTION_GROUPS: AppSectionGroup[] = [
  {
    key: "empresa",
    title: "Tu empresa",
    sections: [
      {
        key: "business",
        label: "Business",
        product: "Mercav Business",
        desc: "Equipo, planillas y fidelización de clientes",
        href: "/business",
        icon: Building2,
        needsAccount: true,
        isNew: true,
      },
    ],
  },
  {
    key: "herramientas",
    title: "Herramientas",
    sections: [
      { key: "tools", label: "Herramientas", product: "Mercav Herramientas", desc: "Calculadoras, contratos, SEO e IA", href: "/herramientas", icon: Wrench },
      { key: "pwn", label: "Pwn", product: "Mercav Pwn", desc: "Filtraciones, exposición y alertas", href: "/pwn", icon: Shield },
      {
        key: "calendario",
        label: "Calendario",
        desc: "Feriados de tu país y calendario hebreo",
        href: "/calendario",
        icon: CalendarDays,
        needsAccount: true,
        isNew: true,
      },
    ],
  },
  {
    key: "mercado",
    title: "Mercado",
    sections: [
      {
        key: "mercado",
        label: "Mercado",
        desc: "Publicidad, servicios y empleos",
        href: "/anuncios",
        icon: Store,
        also: ["/servicios", "/empleos"],
      },
    ],
  },
  {
    key: "comunidad",
    title: "Comunidad",
    sections: [
      { key: "feed", label: "Feed", desc: "Novedades de la gente que seguís", href: "/feed", icon: Rss },
      { key: "mensajes", label: "Mensajes", desc: "Conversaciones y soporte", href: "/mensajes", icon: MessageSquare, needsAccount: true },
      { key: "kosher", label: "Kosher", product: "Mercav Kosher", desc: "Atlas, stock y kehilot", href: "/kosher", icon: StarOfDavid },
    ],
  },
  {
    key: "cuenta",
    title: "Tu cuenta",
    sections: [
      { key: "publicar", label: "Publicar", desc: "Un espacio, un servicio o una vacante", href: "/publicar", icon: PlusSquare, needsAccount: true },
      { key: "perfil", label: "Perfil", desc: "Tu perfil, seguridad, tema y plan", href: "/perfil", icon: User, needsAccount: true },
    ],
  },
];

export const APP_SECTIONS: AppSection[] = APP_SECTION_GROUPS.flatMap((group) => group.sections);

export function appSection(key: string): AppSection {
  const found = APP_SECTIONS.find((section) => section.key === key);
  if (!found) throw new Error(`Apartado desconocido: ${key}`);
  return found;
}

/**
 * Los apartados fijos de la navegación, después de Inicio. Son los mismos en el header de la compu y en la barra del celular;
 * el resto se abre desde Apartados, el menú y las tarjetas de Inicio.
 */
export const APP_PRIMARY_KEYS = ["business", "pwn", "calendario"] as const;
export type AppPrimaryKey = (typeof APP_PRIMARY_KEYS)[number];

/** El apartado activo para una ruta, para resaltarlo en la navegación. */
export function activeSectionKey(pathname: string | null | undefined): string | null {
  if (!pathname) return null;
  // Pedidos, ventas y postulantes se abren desde "Tu actividad", en Inicio.
  if (pathname === "/inicio" || pathname.startsWith("/dashboard/")) return "inicio";
  let best: AppSection | null = null;
  for (const section of APP_SECTIONS) {
    const on = [section.href, ...(section.also ?? [])].some((href) => pathname === href || pathname.startsWith(`${href}/`));
    if (on && (!best || section.href.length > best.href.length)) best = section;
  }
  return best?.key ?? null;
}
// creado por pato dev y askforvini
