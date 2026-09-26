"use client";

import { createContext, useContext } from "react";

/**
 * The public host is server-side config (SITE_URL), but the slug fields that
 * preview a public URL are client components. The layout reads it once and
 * hands it down instead of every form hardcoding the domain.
 */
const SiteHostContext = createContext("");

export function SiteHostProvider({
  host,
  children,
}: {
  host: string;
  children: React.ReactNode;
}) {
  return (
    <SiteHostContext.Provider value={host}>{children}</SiteHostContext.Provider>
  );
}

export function useSiteHost(): string {
  return useContext(SiteHostContext);
}
