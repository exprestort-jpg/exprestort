/**
 * Absolute URLs for places outside the browser — Telegram cards, metadata.
 * Falls back to the Vercel-provided production domain so links work on a
 * deployment even before a custom domain is set.
 */
export function siteUrl(path = "/"): string {
  const base =
    process.env.SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000");

  return new URL(path, base).toString();
}
