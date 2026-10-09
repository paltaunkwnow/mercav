"use client";

import { useEffect, useState } from "react";
import { focusRing, formatRelative } from "@/components/pwn/format";

const KEY = "mercav-pwn-recent";
const MAX = 6;

export type RecentLookup = {
  hint: string;
  type: "email" | "domain";
  at: string;
};

function hintFor(type: RecentLookup["type"], value: string): string {
  if (type === "domain") return value;
  const at = value.lastIndexOf("@");
  if (at <= 0 || at === value.length - 1) return "***";
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  const hint = `${local[0]}***@${domain[0]}***`;
  return hint === value ? "***" : hint;
}

function read(): RecentLookup[] {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as { hint?: unknown; type?: unknown; at?: unknown };
      if (typeof row.hint !== "string" || (row.type !== "email" && row.type !== "domain")) return [];
      if (row.type === "email" && row.hint.includes(".") && !row.hint.includes("***")) return [];
      return [{ hint: row.hint, type: row.type, at: typeof row.at === "string" ? row.at : new Date().toISOString() }];
    });
  } catch {
    return [];
  }
}

export function rememberLookup(type: RecentLookup["type"], value: string) {
  const hint = hintFor(type, value);
  if (!hint || (type === "email" && hint === value)) return;
  try {
    const next = [{ hint, type, at: new Date().toISOString() }, ...read().filter((item) => item.hint !== hint || item.type !== type)].slice(0, MAX);
    sessionStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("mercav-pwn-recent"));
  } catch {
    /* sessionStorage can be blocked; the search still stands */
  }
}

export function RecentLookups() {
  const [items, setItems] = useState<RecentLookup[]>([]);

  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    window.addEventListener("mercav-pwn-recent", sync);
    return () => window.removeEventListener("mercav-pwn-recent", sync);
  }, []);

  if (!items.length) return null;

  return (
    <section aria-labelledby="pwn-recent-title" className="mv-panel p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="pwn-recent-title" className="mv-h3 text-lg">
            Consultas de esta sesión
          </h2>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Solo vive en este navegador. El correo se guarda redactado y se pierde al cerrar la pestaña.
          </p>
        </div>
        <button
          type="button"
          className={`mv-link inline-flex min-h-11 items-center text-sm ${focusRing}`}
          onClick={() => {
            try {
              sessionStorage.removeItem(KEY);
            } catch {
              /* sessionStorage bloqueado */
            }
            setItems([]);
          }}
        >
          Borrar historial
        </button>
      </div>
      <ul className="mt-4 flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={`${item.type}:${item.hint}:${item.at}`}
            className="flex items-center justify-between gap-3 rounded-[0.875rem] border border-[var(--mv-hairline)] px-4 py-3"
          >
            <span className="mv-data truncate text-sm text-[var(--text-primary)]">{item.hint}</span>
            <span className="shrink-0 text-xs text-[var(--text-tertiary)]">
              {item.type === "email" ? "Correo" : "Dominio"} · {formatRelative(item.at) ?? "Ahora"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
// creado por pato dev y askforvini
