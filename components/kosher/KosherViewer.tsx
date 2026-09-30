"use client";

import { createContext, useContext, type ReactNode } from "react";

export type ClientViewer = {
  signedIn: boolean;
  name: string | null;
  isModerator: boolean;
  shabbatLocked: boolean;
  city: string | null;
  lat: number | null;
  lng: number | null;
  shabbatMode: boolean;
  denomination: string | null;
  orthodoxStream: string | null;
};

export const GUEST: ClientViewer = {
  signedIn: false,
  name: null,
  isModerator: false,
  shabbatLocked: false,
  city: null,
  lat: null,
  lng: null,
  shabbatMode: false,
  denomination: null,
  orthodoxStream: null,
};

const ViewerContext = createContext<ClientViewer>(GUEST);

export function KosherViewerProvider({ value, children }: { value: ClientViewer; children: ReactNode }) {
  return <ViewerContext.Provider value={value}>{children}</ViewerContext.Provider>;
}

export const useKosherViewer = () => useContext(ViewerContext);

export async function kosherFetch<T = unknown>(url: string, init?: RequestInit & { json?: unknown }) {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });
  const data = (await res.json().catch(() => ({}))) as T & { success?: boolean; error?: string };
  if (!res.ok || data.success === false) {
    throw new Error(data.error || "Algo salió mal. Probá de nuevo.");
  }
  return data;
}
