"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, MessageCircle, Share2, UserPlus } from "@/components/icons";
import type { LoyaltyTypeKey } from "@/lib/business/loyalty/types";
import { units } from "./format";

/** Link para invitar amigos (con el código de referido, nunca con el serial de la tarjeta). */
export function InviteFriends({ url, bonus, type, businessName }: { url: string; bonus: number; type: LoyaltyTypeKey; businessName: string }) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    return () => window.clearTimeout(timer.current);
  }, []);

  const text = `Sumate al club de ${businessName} y empezá a juntar premios.`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      inputRef.current?.select();
    }
  }

  async function share() {
    try {
      await navigator.share({ title: businessName, text, url });
    } catch {
      /* el cliente cerró el menú */
    }
  }

  return (
    <section aria-labelledby="invite-title" className="mv-panel flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--mv-gold-wash)] text-gold" aria-hidden>
          <UserPlus className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 id="invite-title" className="font-display text-lg font-semibold tracking-tight text-[var(--text-primary)]">
            Invitá a tus amigos
          </h2>
          <p className="text-sm leading-snug text-[var(--text-secondary)]">
            Cuando tu amigo sume {type === "STAMPS" ? "su primer sello" : "sus primeros puntos"}, te regalamos {units(type, bonus)}.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <label htmlFor="invite-link" className="sr-only">
          Tu link para invitar
        </label>
        <input
          ref={inputRef}
          id="invite-link"
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="mv-input mv-data h-11 min-w-0 flex-1 text-[13px]"
        />
        <button type="button" onClick={copy} className="mv-btn mv-btn-secondary h-11 w-11 shrink-0 px-0" aria-label={copied ? "Link copiado" : "Copiar link"}>
          {copied ? <Check className="h-4 w-4 text-gold" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="mv-btn mv-btn-secondary">
          <MessageCircle className="h-4 w-4" aria-hidden />
          WhatsApp
        </a>
        {canShare ? (
          <button type="button" onClick={share} className="mv-btn mv-btn-secondary">
            <Share2 className="h-4 w-4" aria-hidden />
            Compartir
          </button>
        ) : (
          <button type="button" onClick={copy} className="mv-btn mv-btn-secondary">
            {copied ? <Check className="h-4 w-4 text-gold" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
            {copied ? "¡Copiado!" : "Copiar link"}
          </button>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {copied ? "Link copiado" : ""}
      </p>
    </section>
  );
}
// creado por pato dev y askforvini
