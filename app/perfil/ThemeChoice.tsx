"use client";

import { Check, Moon, Sun } from "@/components/icons";
import { useTheme } from "@/components/ui/ThemeProvider";

const THEMES = [
  { value: "dark", label: "Oscuro", desc: "Menos brillo, ideal de noche", icon: Moon },
  { value: "light", label: "Claro", desc: "Más luminosidad y contraste", icon: Sun },
] as const;

/** Elección de tema en Perfil. En el celular con sesión es el único lugar para cambiarlo: el header le deja ese lugar a Mensajes. */
export function ThemeChoice({ labelledBy }: { labelledBy: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {THEMES.map(({ value, label, desc, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={`mv-focus relative flex items-center gap-4 rounded-[1.25rem] border p-4 text-left transition-colors duration-200 sm:p-5 ${
              active ? "border-[var(--color-border-gold)] bg-[var(--mv-gold-wash)]" : "border-[var(--mv-hairline)] bg-[var(--mv-panel)] hover:bg-[var(--mv-panel-hover)]"
            }`}
          >
            <span
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${active ? "bg-gold text-[var(--mv-on-gold)]" : "border border-[var(--mv-hairline)] text-[var(--text-secondary)]"}`}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-[var(--text-primary)]">{label}</span>
              <span className="block text-sm text-[var(--text-secondary)]">{desc}</span>
            </span>
            {active && <Check className="h-5 w-5 shrink-0 text-gold" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}
// creado por pato dev y askforvini
