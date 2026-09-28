import "server-only";
import { DeleteObjectsCommand } from "@aws-sdk/client-s3";
// TRANSITIONAL: rows written before the R2 migration still hold Vercel URLs.
// Removed, along with the dependency, once no row points at Vercel Blob.
import { del } from "@vercel/blob";
import { bucket, keyFromUrl, r2 } from "./r2";

const LEGACY_BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

function isLegacyBlob(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(LEGACY_BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/** DeleteObjects accepts at most 1000 keys per request. */
function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/**
 * Removes files that are no longer referenced. Failures are swallowed on
 * purpose: an orphaned object costs a few kilobytes, while a throw here would
 * roll back a save the admin already completed.
 *
 * Both stores are handled while migrated and un-migrated rows coexist. A URL on
 * neither host is ignored rather than guessed at.
 */
export async function deleteBlobs(
  urls: (string | null | undefined)[],
): Promise<void> {
  const present = urls.filter((url): url is string => Boolean(url));

  const keys = present
    .map(keyFromUrl)
    .filter((key): key is string => key !== null);

  if (keys.length > 0) {
    try {
      for (const batch of chunk(keys, 1000)) {
        await r2().send(
          new DeleteObjectsCommand({
            Bucket: bucket(),
            Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
          }),
        );
      }
    } catch (error) {
      console.error("Failed to delete R2 objects", error);
    }
  }

  const legacy = present.filter(isLegacyBlob);
  if (legacy.length > 0) {
    try {
      await del(legacy);
    } catch (error) {
      console.error("Failed to delete legacy blobs", error);
    }
  }
}
