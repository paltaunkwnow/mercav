"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Offline sales queue. When the sale POST fails because there is no network, the sale is stored in
 * localStorage (per POS config) with a clientRef. The API treats clientRef as an idempotency key, so a
 * sale sent twice is stored once.
 */

export interface QueuedSale {
  clientRef: string;
  payload: Record<string, unknown>;
  /** Sale-shaped object for the on-screen ticket while it waits. Display only. */
  preview: Record<string, unknown>;
  createdAt: string;
  error?: string;
}

const ACTIVE_KEY = "mercav-pos-active-config";
const queueKey = (configId: string) => `mercav-pos-queue:${configId}`;
export const QUEUE_EVENT = "mercav-pos-queue";
export const SYNCED_EVENT = "mercav-pos-synced";

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function setActivePosConfig(configId: string) {
  write(ACTIVE_KEY, configId);
}

export function activePosConfig() {
  return read(ACTIVE_KEY);
}

export function readQueue(configId = activePosConfig()): QueuedSale[] {
  if (!configId) return [];
  try {
    const list = JSON.parse(read(queueKey(configId)) ?? "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeQueue(configId: string, list: QueuedSale[]) {
  const ok = write(queueKey(configId), JSON.stringify(list));
  window.dispatchEvent(new Event(QUEUE_EVENT));
  return ok;
}

/** Returns false when the browser refused to store it (private mode, quota). */
export function enqueueSale(configId: string, entry: QueuedSale) {
  return writeQueue(configId, [...readQueue(configId).filter((e) => e.clientRef !== entry.clientRef), entry]);
}

export function discardQueued(clientRef: string) {
  const id = activePosConfig();
  if (!id) return;
  writeQueue(id, readQueue(id).filter((e) => e.clientRef !== clientRef));
}

export function newClientRef() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // RFC 4122 v4 from getRandomValues, for older Safari.
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** fetch() rejects with a TypeError when the request never reached the server. */
export function isNetworkError(error: unknown) {
  return error instanceof TypeError;
}

let syncing: Promise<{ synced: number; failed: number }> | null = null;

/** Sends every queued sale once. Stops at the first network error; keeps rejected sales with their reason. */
export function syncQueue() {
  if (syncing) return syncing;
  syncing = (async () => {
    const id = activePosConfig();
    if (!id) return { synced: 0, failed: 0 };
    let list = readQueue(id);
    let synced = 0;
    for (const entry of [...list]) {
      let res: Response;
      try {
        res = await fetch("/api/pos/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...entry.payload, clientRef: entry.clientRef }),
        });
      } catch {
        break;
      }
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        list = list.filter((e) => e.clientRef !== entry.clientRef);
        synced++;
      } else if (res.status >= 500) {
        break;
      } else {
        list = list.map((e) => (e.clientRef === entry.clientRef ? { ...e, error: data?.error || "La venta fue rechazada" } : e));
      }
    }
    writeQueue(id, list);
    if (synced > 0) window.dispatchEvent(new Event(SYNCED_EVENT));
    return { synced, failed: list.filter((e) => e.error).length };
  })().finally(() => {
    syncing = null;
  });
  return syncing;
}

/** Connection and queue state for the header indicator. Syncs on its own when the browser comes back online. */
export function usePosSync() {
  const [online, setOnline] = useState(true);
  const [queue, setQueue] = useState<QueuedSale[]>([]);
  const [busy, setBusy] = useState(false);

  const sync = useCallback(async () => {
    if (!readQueue().length) return;
    setBusy(true);
    try {
      await syncQueue();
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    const refresh = () => setQueue(readQueue());
    const goOnline = () => {
      setOnline(true);
      sync();
    };
    const goOffline = () => setOnline(false);
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith("mercav-pos-queue:")) refresh();
    };

    setOnline(navigator.onLine);
    refresh();
    if (navigator.onLine) sync();

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    window.addEventListener(QUEUE_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener(QUEUE_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, [sync]);

  return { online, pending: queue.length, rejected: queue.filter((e) => e.error), syncing: busy, sync };
}
// creado por pato dev y askforvini
