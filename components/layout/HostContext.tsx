"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { KOSHER_HOST, PRIVACY_HOST, appPathFor, hostHref, isAbsoluteUrl, isPrivacyPath, type HostKind } from "@/lib/seo/site";

// The host kind comes from the request's Host header (app/layout.tsx). usePathname() can't tell it: after the
// kosher.mercav.lat rewrite it returns the browser path (/mapa), not the route (/kosher/mapa).
const HostContext = createContext<HostKind>("dev");

export function HostProvider({ kind, children }: { kind: HostKind; children: ReactNode }) {
  return <HostContext.Provider value={kind}>{children}</HostContext.Provider>;
}

export function useHostKind() {
  return useContext(HostContext);
}

/** The route Next.js is rendering (kosher.mercav.lat/mapa → /kosher/mapa). Same as usePathname() elsewhere. */
export function useAppPathname() {
  const pathname = usePathname();
  const kind = useHostKind();
  if (!pathname) return pathname;
  if (kind === "kosher") return appPathFor(KOSHER_HOST, pathname);
  if (kind === "privacy") return appPathFor(PRIVACY_HOST, pathname);
  return pathname;
}

/**
 * En local y en las previews /privacy comparte origen con el resto, pero el layout raíz la arma sin rastreadores ni el
 * chrome de Mercav: entrar o salir de ahí tiene que recargar la página, como pasa entre dominios en producción.
 */
function crossesPrivacy(kind: HostKind, from: string | null, target: string) {
  if (kind !== "dev" || !target.startsWith("/") || target.startsWith("//")) return false;
  return isPrivacyPath(target.split(/[?#]/)[0]) !== isPrivacyPath(from ?? "/");
}

/** router.push that leaves for another host with a full page load. */
export function useHostNavigate() {
  const router = useRouter();
  const kind = useHostKind();
  const current = useAppPathname();
  return useCallback(
    (href: string) => {
      const target = hostHref(href, kind);
      if (isAbsoluteUrl(target) || crossesPrivacy(kind, current, target)) window.location.assign(target);
      else router.push(target);
    },
    [current, kind, router],
  );
}

type HostLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & { href: string };

/** next/link for an app path; a plain <a> when the path lives on another host (no cross-origin prefetch). */
export function HostLink({ href, as, replace, scroll, shallow, passHref, prefetch, locale, legacyBehavior, ...anchor }: HostLinkProps) {
  const kind = useHostKind();
  const current = useAppPathname();
  const target = hostHref(href, kind);
  if (isAbsoluteUrl(target) || crossesPrivacy(kind, current, target)) return <a href={target} {...anchor} />;
  const linkProps = { as, replace, scroll, shallow, passHref, prefetch, locale, legacyBehavior };
  return <Link href={target} {...linkProps} {...anchor} />;
}
// creado por pato dev y askforvini
