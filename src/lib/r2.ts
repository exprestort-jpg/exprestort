import { S3Client } from "@aws-sdk/client-s3";

// Deliberately no `server-only` import here, unlike lib/blob.ts: the CLI
// scripts need this module, and `server-only` resolves to its throwing browser
// entry under tsx. The credentials are plain env vars with no NEXT_PUBLIC_
// prefix, so a client bundle could not read them regardless.

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

let client: S3Client | undefined;

/**
 * One client per server instance, built on first use so a machine without R2
 * credentials can still run `next build`.
 *
 * The two checksum options are load-bearing, not tidy-up candidates: since
 * v3.729 the SDK adds an `x-amz-checksum-crc32` header to PutObject by default.
 * R2 rejects it outright, and on a presigned URL it is worse — the header gets
 * folded into the signature while the browser never sends it, so every upload
 * fails with a 403 that points nowhere useful.
 */
export function r2(): S3Client {
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env("R2_ACCESS_KEY_ID"),
      secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return client;
}

export function bucket(): string {
  return env("R2_BUCKET");
}

/** No trailing slash, so callers can join with a single "/". */
export function publicBaseUrl(): string {
  return env("R2_PUBLIC_BASE_URL").replace(/\/$/, "");
}

/** Public URL for a key. Keys are ASCII by construction — see storage-keys.ts. */
export function publicUrl(key: string): string {
  return `${publicBaseUrl()}/${key}`;
}

/**
 * Inverse of publicUrl. Returns null for anything not served from our bucket,
 * which is what keeps a hand-edited or third-party URL from ever reaching a
 * delete call.
 */
export function keyFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.host !== new URL(publicBaseUrl()).host) return null;
    return decodeURIComponent(parsed.pathname.replace(/^\//, "")) || null;
  } catch {
    return null;
  }
}
