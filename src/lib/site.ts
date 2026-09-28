/**
 * Absolute URLs for places outside the browser — Telegram cards, metadata.
 *
 * SITE_URL wins; the host-provided domains are fallbacks so links still work on
 * a deployment that has no custom domain yet. Netlify sets URL to the site's
 * primary address and DEPLOY_PRIME_URL on branch and preview deploys, which is
 * why both are consulted — without them the whole thing silently degrades to
 * localhost, and a manager gets order notifications they cannot click.
 */
export function siteUrl(path = "/"): string {
  const base =
    process.env.SITE_URL ??
    process.env.URL ??
    process.env.DEPLOY_PRIME_URL ??
    "http://localhost:3000";

  return new URL(path, base).toString();
}

/**
 * Host only, no scheme — for UI that previews a public URL to an admin.
 */
export function siteHost(): string {
  return new URL(siteUrl()).host;
}
