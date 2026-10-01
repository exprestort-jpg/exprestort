/**
 * Absolute URLs for places outside the browser — Telegram cards, metadata.
 *
 * SITE_URL wins; the host-provided domain is a fallback so links still work on
 * a deployment that has no custom domain yet. Railway exposes it as a bare host
 * in RAILWAY_PUBLIC_DOMAIN — without it the whole thing silently degrades to
 * localhost, and a manager gets order notifications they cannot click.
 */
export function siteUrl(path = "/"): string {
  const railway = process.env.RAILWAY_PUBLIC_DOMAIN;
  const base =
    process.env.SITE_URL ??
    (railway ? `https://${railway}` : undefined) ??
    "http://localhost:3000";

  return new URL(path, base).toString();
}

/**
 * Host only, no scheme — for UI that previews a public URL to an admin.
 */
export function siteHost(): string {
  return new URL(siteUrl()).host;
}
