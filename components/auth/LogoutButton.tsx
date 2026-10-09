"use client";

import { LogOut } from "@/components/icons";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/' })}
      className={cn(
        "mv-btn w-full border border-red-500/25 text-red-400 hover:bg-red-500/10 sm:w-auto",
        className,
      )}
    >
      <LogOut className="h-4 w-4" aria-hidden /> Cerrar sesión
    </button>
  );
}
// creado por pato dev y askforvini
