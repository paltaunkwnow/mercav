import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function Forbidden() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <ShieldAlert className="h-16 w-16 text-gold mb-6" />
      <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Acceso Denegado</h2>
      <p className="text-gray-400 mb-8 max-w-md">
        No tenés permisos para acceder a este contenido.
      </p>
      <Button asChild className="bg-gold text-black hover:bg-gold-light">
        <Link href="/">
          Volver al inicio
        </Link>
      </Button>
    </div>
  );
}
