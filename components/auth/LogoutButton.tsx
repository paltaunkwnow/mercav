"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <Button 
      onClick={() => signOut({ callbackUrl: '/' })} 
      variant="outline" 
      className="w-full mt-8 border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-all rounded-xl h-12 font-bold"
    >
      <LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión
    </Button>
  );
}
// creado por Patodev y Invertilo
