import { mkdir, readFile, writeFile } from "node:fs/promises";
import { HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { list } from "@vercel/blob";
import { eq, sql } from "drizzle-orm";
import { db, withTransaction } from "@/db";
import { categories, productImages, reviews, siteSettings } from "@/db/schema";
import { bucket, publicUrl, r2 } from "@/lib/r2";
import { contentTypeForKey, legacyKey } from "@/lib/storage-keys";

/**
 * Moves every image from Vercel Blob to R2 and repoints the database at it.
 *
 * Phases run separately so the risky one stands alone:
 *   --copy      storage only, never touches the database, safe to repeat
 *   --verify    proves the copies are intact and publicly reachable
 *   --rewrite   the cutover: swaps URLs in the five columns that hold them
 *   --rollback  swaps them back, using the same manifest
 *
 * With no flag it runs copy and verify, then stops short of the cutover.
 *
 * Nothing is ever deleted from Vercel: those files are the way back. Note that
 * deleting the Vercel *project* destroys the blob store, so this has to finish
 * before any teardown there.
 */

const MANIFEST_DIR = "scripts/.migration";
const MANIFEST_PATH = `${MANIFEST_DIR}/blob-to-r2.json`;

type Entry = {
  oldUrl: string;
  key: string;
  newUrl: string;
  size: number;
  copied: boolean;
};

async function loadManifest(): Promise<Entry[]> {
  try {
    return JSON.parse(await readFile(MANIFEST_PATH, "utf8")) as Entry[];
  } catch {
    return [];
  }
}

async function saveManifest(entries: Entry[]): Promise<void> {
  await mkdir(MANIFEST_DIR, { recursive: true });
  await writeFile(MANIFEST_PATH, `${JSON.stringify(entries, null, 2)}\n`);
}

async function objectExists(key: string, size: number): Promise<boolean> {
  try {
    const head = await r2().send(
      new HeadObjectCommand({ Bucket: bucket(), Key: key }),
    );
    return head.ContentLength === size;
  } catch {
    return false;
  }
}

async function copyPhase(): Promise<Entry[]> {
  const entries = await loadManifest();
  const byOldUrl = new Map(entries.map((entry) => [entry.oldUrl, entry]));
  // Transliteration lowercases, and Vercel's random suffix is case-sensitive,
  // so two distinct blobs can in principle collapse onto one key. Rare, but it
  // would silently destroy an image, so disambiguate instead of hoping.
  const usedKeys = new Map(entries.map((entry) => [entry.key, entry.oldUrl]));

  let cursor: string | undefined;
  do {
    const page = await list({ cursor, limit: 1000 });

    for (const blob of page.blobs) {
      if (byOldUrl.has(blob.url)) continue;

      let key = legacyKey(blob.pathname);
      for (let n = 2; usedKeys.has(key); n += 1) {
        const dot = key.lastIndexOf(".");
        key =
          dot > 0
            ? `${key.slice(0, dot)}-${n}${key.slice(dot)}`
            : `${key}-${n}`;
      }
      usedKeys.set(key, blob.url);

      byOldUrl.set(blob.url, {
        oldUrl: blob.url,
        key,
        newUrl: publicUrl(key),
        size: blob.size,
        copied: false,
      });
    }

    cursor = page.cursor;
  } while (cursor);

  const all = [...byOldUrl.values()];
  await saveManifest(all);
  console.log(`${all.length} blobs catalogued.`);

  for (const entry of all) {
    if (entry.copied) continue;

    // A previous run may have finished the upload and died before recording it.
    if (await objectExists(entry.key, entry.size)) {
      entry.copied = true;
      await saveManifest(all);
      console.log(`  already there: ${entry.key}`);
      continue;
    }

    const response = await fetch(entry.oldUrl);
    if (!response.ok) {
      throw new Error(`Download failed (${response.status}): ${entry.oldUrl}`);
    }
    const body = Buffer.from(await response.arrayBuffer());
    if (body.byteLength !== entry.size) {
      throw new Error(
        `Size mismatch for ${entry.oldUrl}: expected ${entry.size}, got ${body.byteLength}`,
      );
    }

    await r2().send(
      new PutObjectCommand({
        Bucket: bucket(),
        Key: entry.key,
        Body: body,
        ContentType:
          response.headers.get("content-type") ?? contentTypeForKey(entry.key),
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    entry.copied = true;
    // Flushed per file rather than at the end: at this volume the write costs
    // nothing and it makes any crash resumable to the exact image.
    await saveManifest(all);
    console.log(`  copied ${entry.key} (${(entry.size / 1024).toFixed(0)} KB)`);
  }

  const copied = all.filter((entry) => entry.copied).length;
  console.log(`${copied}/${all.length} copied.`);
  return all;
}

async function verifyPhase(entries: Entry[]): Promise<void> {
  let checked = 0;

  for (const entry of entries) {
    if (!(await objectExists(entry.key, entry.size))) {
      throw new Error(`Missing or wrong size in R2: ${entry.key}`);
    }
    checked += 1;
  }
  console.log(`${checked} objects present with matching sizes.`);

  // HeadObject goes through the S3 API, which answers even when the bucket's
  // public binding is wrong. Fetching over the public host is what actually
  // proves the URLs we are about to write into the database will resolve.
  for (const entry of entries.slice(0, 5)) {
    const response = await fetch(entry.newUrl);
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !type.startsWith("image/")) {
      throw new Error(
        `Public URL not serving an image (${response.status}, ${type}): ${entry.newUrl}`,
      );
    }
  }
  console.log(
    `Public host reachable (spot-checked ${Math.min(5, entries.length)}).`,
  );
}

async function remainingLegacyRows(): Promise<number> {
  const pattern = "%.public.blob.vercel-storage.com%";
  const result = await db.execute<{ count: number }>(sql`
    select
      (select count(*) from product_images where url like ${pattern})
      + (select count(*) from categories where image_url like ${pattern})
      + (select count(*) from reviews where avatar_url like ${pattern})
      + (select count(*) from site_settings where hero_image_url like ${pattern})
      + (select count(*) from site_settings where about_image_url like ${pattern})
      as count
  `);
  return Number(result.rows[0]?.count ?? 0);
}

async function swap(pairs: [string, string][]): Promise<void> {
  // One transaction across all five columns. The default `db` export is the
  // Neon HTTP driver and cannot open one, hence withTransaction.
  await withTransaction(async (tx) => {
    for (const [from, to] of pairs) {
      await tx
        .update(productImages)
        .set({ url: to })
        .where(eq(productImages.url, from));
      await tx
        .update(categories)
        .set({ imageUrl: to })
        .where(eq(categories.imageUrl, from));
      await tx
        .update(reviews)
        .set({ avatarUrl: to })
        .where(eq(reviews.avatarUrl, from));
      await tx
        .update(siteSettings)
        .set({ heroImageUrl: to })
        .where(eq(siteSettings.heroImageUrl, from));
      await tx
        .update(siteSettings)
        .set({ aboutImageUrl: to })
        .where(eq(siteSettings.aboutImageUrl, from));
    }
  });
}

async function rewritePhase(entries: Entry[]): Promise<void> {
  const pairs = entries
    .filter((entry) => entry.copied)
    .map((entry): [string, string] => [entry.oldUrl, entry.newUrl]);

  // Every update is keyed on the exact old URL, so a row already carrying the
  // new one matches nothing and a repeat run is a no-op.
  await swap(pairs);

  const left = await remainingLegacyRows();
  console.log(
    `Rewrote ${pairs.length} URLs. Rows still on Vercel Blob: ${left}`,
  );
  if (left > 0) {
    console.log(
      "Not zero — do not run prune:blobs and do not remove the Vercel remotePattern yet.",
    );
  }
}

async function rollbackPhase(entries: Entry[]): Promise<void> {
  const pairs = entries
    .filter((entry) => entry.copied)
    .map((entry): [string, string] => [entry.newUrl, entry.oldUrl]);

  await swap(pairs);
  console.log(`Reverted ${pairs.length} URLs to Vercel Blob.`);
  console.log(
    "Any image uploaded after the cutover has no Vercel original and will now 404 — re-upload those by hand.",
  );
}

async function main() {
  const flags = process.argv.slice(2);
  const has = (flag: string) => flags.includes(flag);

  if (has("--rollback")) {
    await rollbackPhase(await loadManifest());
    return;
  }

  if (has("--rewrite")) {
    const entries = await loadManifest();
    if (entries.length === 0) {
      throw new Error("No manifest — run --copy first.");
    }
    await verifyPhase(entries);
    await rewritePhase(entries);
    return;
  }

  if (has("--verify")) {
    await verifyPhase(await loadManifest());
    return;
  }

  const entries = await copyPhase();
  await verifyPhase(entries);
  console.log(
    "\nCopy verified. Re-run with --rewrite to repoint the database.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
