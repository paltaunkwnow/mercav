"use client";

import { useSession } from "next-auth/react";
import { isAdmin } from "@/lib/pwn/permissions";

export type PwnSessionState = {
  status: "loading" | "authenticated" | "unauthenticated";
  isAdmin: boolean;
  email: string | null;
};

/**
 * Estado de sesión para las páginas de Pwn: primero se mira la sesión y, sin ella,
 * se muestra el estado de "iniciá sesión" sin pedir nada privado (antes cada página respondía 401).
 * El rol de administrador solo decide qué se muestra; la API lo vuelve a comprobar contra la base.
 */
export function usePwnSession(): PwnSessionState {
  const { data, status } = useSession();
  const user = data?.user as { roles?: unknown; email?: unknown } | undefined;
  const roles = Array.isArray(user?.roles) ? user.roles.filter((role): role is string => typeof role === "string") : [];
  return {
    status,
    isAdmin: status === "authenticated" && isAdmin(roles),
    email: status === "authenticated" && typeof user?.email === "string" ? user.email : null,
  };
}
// creado por pato dev y askforvini
