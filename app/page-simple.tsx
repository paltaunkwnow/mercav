/**
 * Landing page simplificada para dueños de cafés/negocios pequeños
 * Remplaza `/page.tsx` cuando esté lista
 *
 * Cambios clave:
 * - Solo 3 features: Inventario, Trabajadores, Nómina
 * - Quita Pwn, Kosher, Ads, Services, Jobs de la vista
 * - Headline simple: "Gestiona tu negocio sin Excel"
 * - CTA clara: "Comenzar gratis"
 * - Sin stickers, sin complicaciones
 */

import {
  LandingHeroSimple,
  LandingProblems,
  LandingFeatures,
  LandingSocialProof,
  LandingCTASimple,
  LandingFAQSimple,
} from "@/components/home/HomeLandingSimple";

export default function SimpleHome() {
  return (
    <div className="flex w-full flex-col overflow-x-clip">
      <LandingHeroSimple />
      <LandingProblems />
      <LandingFeatures />
      <LandingSocialProof />
      <LandingCTASimple />
      <LandingFAQSimple />
    </div>
  );
}
