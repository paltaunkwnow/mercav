import { WifiOff } from "lucide-react";

export default function Offline() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <WifiOff className="h-16 w-16 text-gray-500 mb-6" />
      <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Sin conexión a internet.</h2>
      <p className="text-gray-400 mb-8 max-w-md">
        Algunas funciones no están disponibles. Por favor, revisa tu conexión y vuelve a intentarlo.
      </p>
    </div>
  );
}
