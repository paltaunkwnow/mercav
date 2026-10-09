import {
  BookOpen,
  Cake,
  CalendarHeart,
  Car,
  Coffee,
  Croissant,
  Crown,
  Dumbbell,
  Flower2,
  Gift,
  Heart,
  IceCreamCone,
  Pill,
  Pizza,
  PawPrint,
  Scissors,
  Shirt,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Tag,
  Truck,
  UtensilsCrossed,
  Beer,
} from "@/components/icons";
import type { ComponentType, SVGProps } from "react";
import { StarOfDavid } from "@/components/site/StarOfDavid";
import type { BenefitKey, LoyaltyIconKey } from "@/lib/business/loyalty/types";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number | string }>;

const ICONS: Record<LoyaltyIconKey | BenefitKey, IconComponent> = {
  coffee: Coffee,
  croissant: Croissant,
  utensils: UtensilsCrossed,
  pizza: Pizza,
  icecream: IceCreamCone,
  beer: Beer,
  scissors: Scissors,
  sparkles: Sparkles,
  dumbbell: Dumbbell,
  car: Car,
  shirt: Shirt,
  pill: Pill,
  flower: Flower2,
  bag: ShoppingBag,
  book: BookOpen,
  paw: PawPrint,
  "star-of-david": StarOfDavid as IconComponent,
  store: Store,
  descuentos: Tag,
  promociones: Star,
  recompensas: Gift,
  experiencias: Heart,
  eventos: CalendarHeart,
  regalos: Gift,
  cumpleanos: Cake,
  prioridad: Crown,
  envios: Truck,
  clases: Dumbbell,
};

/** Ícono de rubro o de beneficio de Fidelización. */
export function LoyaltyIcon({ name, className, strokeWidth = 1.6 }: { name: LoyaltyIconKey | BenefitKey; className?: string; strokeWidth?: number }) {
  const Icon = ICONS[name] ?? Store;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
}
// creado por pato dev y askforvini
