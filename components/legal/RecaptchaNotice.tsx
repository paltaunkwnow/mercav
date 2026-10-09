import { cn } from "@/lib/utils";

/**
 * El aviso de reCAPTCHA que Google pide en cada formulario protegido cuando el ícono flotante va oculto
 * (.grecaptcha-badge en app/globals.css).
 */
export function RecaptchaNotice({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs leading-relaxed text-[var(--text-tertiary)]", className)}>
      Este sitio está protegido por reCAPTCHA y se aplican la{" "}
      <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="mv-link font-medium">
        Política de privacidad
      </a>{" "}
      y las{" "}
      <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="mv-link font-medium">
        Condiciones del servicio
      </a>{" "}
      de Google.
    </p>
  );
}
// creado por pato dev y askforvini
