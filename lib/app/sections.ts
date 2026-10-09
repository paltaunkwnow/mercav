import {
  Briefcase,
  Building2,
  CalendarDays,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  MonitorPlay,
  PlusSquare,
  Rss,
  Settings,
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
      { key: "jobs", label: "Empleos", product: "Mercav Empleos", desc: "Vacantes y postulaciones", href: "/empleos", icon: Briefcase },
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
      { key: "ads", label: "Publicidad", product: "Mercav Publicidad", desc: "Vallas, pantallas y vidrieras por fechas", href: "/anuncios", icon: Megaphone },
      { key: "services", label: "Servicios", product: "Mercav Servicios", desc: "Talento digital con pago por hitos", href: "/servicios", icon: MonitorPlay },
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
      { key: "panel", label: "Mi panel", desc: "Tus publicaciones, pedidos y postulantes", href: "/dashboard", icon: LayoutDashboard, needsAccount: true },
      { key: "publicar", label: "Publicar", desc: "Un espacio, un servicio o una vacante", href: "/publicar", icon: PlusSquare, needsAccount: true },
      { key: "perfil", label: "Perfil", desc: "Cómo te ven los demás", href: "/perfil", icon: User, needsAccount: true },
      { key: "ajustes", label: "Ajustes", desc: "Seguridad, 2FA y preferencias", href: "/perfil/configuracion", icon: Settings, needsAccount: true },
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
  if (pathname === "/inicio") return "inicio";
  let best: AppSection | null = null;
  for (const section of APP_SECTIONS) {
    const on = pathname === section.href || pathname.startsWith(`${section.href}/`);
    if (on && (!best || section.href.length > best.href.length)) best = section;
  }
  return best?.key ?? null;
}
// creado por pato dev y askforvini
