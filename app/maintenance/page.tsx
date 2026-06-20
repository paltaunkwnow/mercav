import { Wrench } from "lucide-react";

export default function Maintenance() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <Wrench className="h-16 w-16 text-gold mb-6" />
      <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Mercav está en mantenimiento.</h2>
      <p className="text-gray-400 mb-8 max-w-md">
        Volvemos pronto. Estamos realizando mejoras en la plataforma para brindarte una mejor experiencia.
      </p>
    </div>
  );
}
