import { AppTabs } from "./AppPage";

/** Las tres partes del Mercado, con el mismo lugar y el mismo orden en cada catálogo. */
export function MarketTabs({ active }: { active: "anuncios" | "servicios" | "empleos" }) {
  return (
    <AppTabs
      active={active}
      items={[
        { key: "anuncios", label: "Publicidad", href: "/anuncios" },
        { key: "servicios", label: "Servicios", href: "/servicios" },
        { key: "empleos", label: "Empleos", href: "/empleos" },
      ]}
    />
  );
}

/** Tus publicaciones del Mercado: una pestaña por tipo. */
export function MyListingsTabs({ active }: { active: "anuncios" | "servicios" | "empleos" }) {
  return (
    <AppTabs
      active={active}
      items={[
        { key: "anuncios", label: "Espacios", href: "/anuncios/mis-espacios" },
        { key: "servicios", label: "Servicios", href: "/servicios/mis-servicios" },
        { key: "empleos", label: "Vacantes", href: "/empleos/mis-empleos" },
      ]}
    />
  );
}
// creado por pato dev y askforvini
