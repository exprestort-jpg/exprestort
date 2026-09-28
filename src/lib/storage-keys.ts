import { randomUUID } from "node:crypto";
import { slugify } from "./slug";

export const SCOPES = [
  "uploads",
  "products",
  "categories",
  "reviews",
  "site",
] as const;

export type Scope = (typeof SCOPES)[number];

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export const ALLOWED_CONTENT_TYPES = Object.keys(EXTENSIONS);

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/**
 * Builds an object key like `uploads/2026/09/a1b2c3d4-medovyi-tort.jpg`.
 *
 * The random segment carries all of the collision safety; the slug is there
 * only so the bucket stays readable to a human browsing it. Ukrainian file
 * names go through the same transliteration as product slugs, so keys stay
 * ASCII and their URLs never need percent-encoding.
 *
 * The extension comes from the content type the caller already validated, never
 * from the name the browser supplied — that name is attacker-controlled and its
 * extension need not match the bytes.
 */
export function buildKey(
  scope: Scope,
  filename: string,
  contentType: string,
): string {
  const extension = EXTENSIONS[contentType];
  if (!extension) throw new Error(`Unsupported content type: ${contentType}`);

  const base = slugify(filename.replace(/\.[^./\\]+$/, "")).slice(0, 48);
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const unique = randomUUID().slice(0, 8);

  return `${scope}/${year}/${month}/${unique}-${base || "image"}.${extension}`;
}

/**
 * Key for a file carried over from Vercel Blob. Derived from the old pathname
 * rather than generated, because that pathname already carries Vercel's own
 * random suffix: the same blob always lands on the same key, which is what lets
 * a half-finished migration run be repeated safely.
 */
export function legacyKey(pathname: string): string {
  const segments = pathname.split("/").map((segment) => {
    const dot = segment.lastIndexOf(".");
    const stem = dot > 0 ? segment.slice(0, dot) : segment;
    const extension = dot > 0 ? segment.slice(dot + 1).toLowerCase() : "";
    const safe = slugify(stem) || "file";
    return extension ? `${safe}.${extension}` : safe;
  });

  return `legacy/${segments.join("/")}`;
}

export function contentTypeForKey(key: string): string {
  const raw = key.split(".").pop()?.toLowerCase() ?? "";
  const extension = raw === "jpeg" ? "jpg" : raw;
  const match = Object.entries(EXTENSIONS).find(([, ext]) => ext === extension);
  return match?.[0] ?? "application/octet-stream";
}
