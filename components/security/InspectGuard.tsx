"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const SKIP_HOST = /^(localhost|127\.0\.0\.1)$/i;
const SKIP_PATH = /^\/(1337|admin)(\/|$)/;

function desktop() {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(pointer: coarse)").matches) return false;
  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) return false;
  return true;
}

function fingerprint() {
  try {
    return [navigator.language, Intl.DateTimeFormat().resolvedOptions().timeZone, screen.width, screen.height].join("|").slice(0, 160);
  } catch {
    return null;
  }
}

async function report(reason: string, path: string) {
  if (sessionStorage.getItem("mercav-1337")) return;
  sessionStorage.setItem("mercav-1337", "1");
  try {
    await fetch("/api/security/unusual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, path, fingerprint: fingerprint() }),
      keepalive: true,
    });
  } catch {
    /* still redirect */
  }
  window.location.replace("/1337");
}

export function InspectGuard() {
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (SKIP_HOST.test(window.location.hostname)) return;
    if (SKIP_PATH.test(pathname || "")) return;
    if ((session?.user as { roles?: string[] } | undefined)?.roles?.includes("ADMIN")) return;
    if (!desktop()) return;

    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const inspect =
        event.key === "F12" ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && ["i", "j", "c"].includes(key)) ||
        ((event.ctrlKey || event.metaKey) && key === "u") ||
        (event.metaKey && event.altKey && key === "i");
      if (!inspect) return;
      event.preventDefault();
      void report("shortcut", pathname || window.location.pathname);
    };

    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [pathname, session]);

  return null;
}
// creado por pato dev y askforvini
