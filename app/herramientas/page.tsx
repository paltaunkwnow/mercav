import type { Metadata } from "next";
import HerramientasClient from "./HerramientasClient";
import { CATALOG_DESCRIPTION, CATALOG_TITLE } from "./toolRoutes";

export const metadata: Metadata = {
  // absolute: the root layout's "%s | Mercav" template would repeat the brand.
  title: { absolute: CATALOG_TITLE },
  description: CATALOG_DESCRIPTION,
  alternates: { canonical: "/herramientas" },
};

export default function HerramientasPage() {
  return <HerramientasClient />;
}
// creado por pato dev y askforvini
