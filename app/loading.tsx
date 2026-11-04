import { SplashScreen } from "@/components/splash/SplashScreen";

/**
 * Pantalla de carga raíz para toda la app.
 * Se muestra mientras cualquier ruta está cargando en el servidor.
 */
export default function RootLoading() {
  return <SplashScreen fullscreen variant="app" />;
}
