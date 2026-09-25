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
    <section aria-label="Consultas de esta sesión" className="rounded-3xl border border-white/5 bg-bg-secondary/70 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl text-white">Consultas de esta sesión</h2>
        <button
          type="button"
          className={`text-sm text-gold underline-offset-4 hover:underline ${focusRing}`}
          onClick={() => {
            sessionStorage.removeItem(KEY);
            setItems([]);
          }}
        >
          Borrar historial
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">Solo vive en este navegador. El correo se guarda redactado y se pierde al cerrar la pestaña.</p>
      <ul className="mt-4 divide-y divide-white/5">
        {items.map((item) => (
          <li key={`${item.type}:${item.hint}:${item.at}`} className="flex items-center justify-between gap-3 py-3">
            <span className="font-mono text-sm text-gray-200">{item.hint}</span>
            <span className="shrink-0 text-xs text-gray-500">{item.type === "email" ? "Correo" : "Dominio"} · {formatRelative(item.at) ?? "Ahora"}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
// creado por Patodev y Invertilo
