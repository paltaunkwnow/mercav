import { RECAPTCHA_SITE_KEY, RECAPTCHA_USE_ENTERPRISE } from "./recaptcha";

/**
 * Obtiene un token de reCAPTCHA de manera resiliente.
 * Si el hook de react-google-recaptcha-v3 aún está cargando el script,
 * espera hasta 2.5 segundos antes de fallar para evitar "reCAPTCHA no disponible".
 */
export async function getRecaptchaToken(
  action: string,
  hookExecute?: (action?: string) => Promise<string>
): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!RECAPTCHA_SITE_KEY) return null;

  // 1. Intento inmediato con el hook de React si ya está listo
  if (hookExecute) {
    try {
      const token = await hookExecute(action);
      if (token && token !== "skip") return token;
    } catch {
      // Continuar con fallback directo
    }
  }

  // 2. Fallback con reintentos consultando window.grecaptcha
  const maxAttempts = 25; // 25 * 100ms = 2.5s
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const w = window as any;
    const g = RECAPTCHA_USE_ENTERPRISE
      ? (w.grecaptcha?.enterprise || w.grecaptcha)
      : (w.grecaptcha || w.grecaptcha?.enterprise);

    if (g && typeof g.execute === "function") {
      try {
        const token = await g.execute(RECAPTCHA_SITE_KEY, { action });
        if (token) return token;
      } catch (err) {
        console.warn("Error ejecutando grecaptcha directo:", err);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return null;
}
