import { Wallet } from "@/components/icons";
import { cn } from "@/lib/utils";

/*
 * Botones para guardar la tarjeta en Apple Wallet y Google Wallet. Mientras no haya link
 * se muestran deshabilitados con "Próximamente". Sin logos de terceros: ícono genérico y texto.
 */

function WalletButton({ href, label }: { href?: string | null; label: string }) {
  const base = "flex h-14 w-full min-w-0 items-center gap-3 rounded-2xl border px-4 text-left";
  if (href) {
    return (
      <a href={href} className={cn(base, "mv-focus border-[var(--mv-hairline-strong)] bg-[#0b0b0c] text-white transition-transform active:scale-[0.98]")}>
        <Wallet className="h-5 w-5 shrink-0" aria-hidden />
        <span className="min-w-0 truncate text-[15px] font-semibold">{label}</span>
      </a>
    );
  }
  return (
    <div className={cn(base, "border-[var(--mv-hairline)] bg-[var(--mv-panel)] text-[var(--text-tertiary)]")} aria-disabled="true">
      <Wallet className="h-5 w-5 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{label}</span>
      <span className="mv-chip shrink-0">Próximamente</span>
    </div>
  );
}

export function WalletButtons({ appleUrl = null, googleUrl = null, className }: { appleUrl?: string | null; googleUrl?: string | null; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-2 sm:grid-cols-2", className)}>
      <WalletButton href={appleUrl} label="Agregar a Apple Wallet" />
      <WalletButton href={googleUrl} label="Agregar a Google Wallet" />
    </div>
  );
}
// creado por pato dev y askforvini
