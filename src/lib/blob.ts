import { del } from "@vercel/blob";

const BLOB_HOST_SUFFIX = ".public.blob.vercel-storage.com";

function isOwnBlob(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(BLOB_HOST_SUFFIX);
  } catch {
    return false;
  }
}

/**
 * Removes files that are no longer referenced. Failures are swallowed on
 * purpose: an orphaned blob costs a few kilobytes, while a throw here would
 * roll back a save the admin already completed.
 */
export async function deleteBlobs(
  urls: (string | null | undefined)[],
): Promise<void> {
  const targets = urls.filter(
    (url): url is string => Boolean(url) && isOwnBlob(url as string),
  );
  if (targets.length === 0) return;

  try {
    await del(targets);
  } catch (error) {
    console.error("Failed to delete blobs", error);
  }
}
