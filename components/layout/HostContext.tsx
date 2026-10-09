"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { KOSHER_HOST, appPathFor, hostHref, isAbsoluteUrl, type HostKind } from "@/lib/seo/site";

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
  return kind === "kosher" && pathname ? appPathFor(KOSHER_HOST, pathname) : pathname;
}

/** router.push that leaves for another host with a full page load. */
export function useHostNavigate() {
  const router = useRouter();
  const kind = useHostKind();
  return useCallback(
    (href: string) => {
      const target = hostHref(href, kind);
      if (isAbsoluteUrl(target)) window.location.assign(target);
      else router.push(target);
    },
    [kind, router],
  );
}

type HostLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, "href"> & { href: string };

/** next/link for an app path; a plain <a> when the path lives on another host (no cross-origin prefetch). */
export function HostLink({ href, as, replace, scroll, shallow, passHref, prefetch, locale, legacyBehavior, ...anchor }: HostLinkProps) {
  const target = hostHref(href, useHostKind());
  if (isAbsoluteUrl(target)) return <a href={target} {...anchor} />;
  const linkProps = { as, replace, scroll, shallow, passHref, prefetch, locale, legacyBehavior };
  return <Link href={target} {...linkProps} {...anchor} />;
}
// creado por pato dev y askforvini
