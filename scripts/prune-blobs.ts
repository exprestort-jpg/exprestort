import { DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { categories, productImages, reviews, siteSettings } from "@/db/schema";
import { bucket, publicUrl, r2 } from "@/lib/r2";

/**
 * Deletes objects that no database row points at any more. Admin saves already
 * clean up after themselves via lib/blob.ts, but a CLI reseed drops rows
 * without touching storage, so the files it abandoned need a sweep.
 *
 * Run `npm run prune:blobs` to list what would go, add `-- --confirm` to delete.
 *
 * Do not run this during the Vercel Blob migration. Until every URL has been
 * rewritten, the database still points at the old host, so every freshly copied
 * object here looks unreferenced and would be deleted.
 */

async function referencedUrls(): Promise<Set<string>> {
  const [images, cats, settings, avatars] = await Promise.all([
    db.select({ url: productImages.url }).from(productImages),
    db
      .select({ url: categories.imageUrl })
      .from(categories)
      .where(isNotNull(categories.imageUrl)),
    db
      .select({
        hero: siteSettings.heroImageUrl,
        about: siteSettings.aboutImageUrl,
      })
      .from(siteSettings),
    db
      .select({ url: reviews.avatarUrl })
      .from(reviews)
      .where(isNotNull(reviews.avatarUrl)),
  ]);

  const urls = [
    ...images.map((r) => r.url),
    ...cats.map((r) => r.url),
    ...avatars.map((r) => r.url),
    ...settings.flatMap((r) => [r.hero, r.about]),
  ];

  return new Set(urls.filter((url): url is string => Boolean(url)));
}

async function allObjects() {
  const objects: { url: string; key: string; size: number }[] = [];
  let token: string | undefined;

  do {
    const page = await r2().send(
      new ListObjectsV2Command({
        Bucket: bucket(),
        ContinuationToken: token,
        MaxKeys: 1000,
      }),
    );

    for (const item of page.Contents ?? []) {
      if (!item.Key) continue;
      objects.push({
        url: publicUrl(item.Key),
        key: item.Key,
        size: item.Size ?? 0,
      });
    }

    // Keyed on IsTruncated, not on the token: R2 returns a continuation token
    // on the final page too, and trusting it loops forever.
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);

  return objects;
}

function formatSize(bytes: number): string {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

async function main() {
  const [keep, objects] = await Promise.all([referencedUrls(), allObjects()]);
  const orphans = objects.filter((o) => !keep.has(o.url));
  const bytes = orphans.reduce((n, o) => n + o.size, 0);

  console.log(
    `${objects.length} objects in storage, ${keep.size} referenced by the database.`,
  );

  if (orphans.length === 0) {
    console.log("Nothing to prune.");
    return;
  }

  for (const object of orphans) {
    console.log(`  ${object.key}  ${formatSize(object.size)}`);
  }
  console.log(`${orphans.length} orphans, ${formatSize(bytes)} total.`);

  if (!process.argv.includes("--confirm")) {
    console.log("Dry run. Re-run with --confirm to delete.");
    return;
  }

  // DeleteObjects accepts at most 1000 keys per request.
  for (const batch of chunk(orphans, 1000)) {
    await r2().send(
      new DeleteObjectsCommand({
        Bucket: bucket(),
        Delete: {
          Objects: batch.map((object) => ({ Key: object.key })),
          Quiet: true,
        },
      }),
    );
  }
  console.log(`Deleted ${orphans.length} objects.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
