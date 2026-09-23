import { readFile } from "node:fs/promises";
import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, productImages, products, siteSettings } from "@/db/schema";

/**
 * Fills the shop with the artwork from the Pencil design so the storefront can
 * be reviewed with real pictures.
 *
 * These are placeholders: the Unsplash shots are other people's cakes, and the
 * generated ones are AI renders. Both must be replaced with the client's own
 * photography before launch — the whole pitch is "we baked these ourselves".
 */

const PENCIL_IMAGES =
  "/Users/vadvoker/.pencil/documents/77457ebe-7cbc-4247-af75-a3bd2e5bf69d/images";

/** Unsplash needs a width hint, otherwise it serves the full-resolution file. */
function unsplash(id: string, width = 1200) {
  return `https://images.unsplash.com/photo-${id}?fm=jpg&q=80&w=${width}&fit=max`;
}

const CATEGORY_PHOTOS: Record<string, string> = {
  "medovi-korzhi": unsplash("1587556770620-2a10173c3025", 800),
  napoleon: unsplash("1763301213080-3bd57e0dbe96", 800),
  "shokoladni-korzhi": unsplash("1569580990590-478357ea38ab", 800),
  "biskvitni-korzhi": unsplash("1627247297593-b7cf46029f85", 800),
};

const PRODUCT_PHOTOS: Record<
  string,
  { local?: string; remote?: string; alt: string }[]
> = {
  "medovi-korzhi-klasychni": [
    {
      local: "generated-1790146027213.png",
      alt: "Медові коржі класичні, стос тонких коржів",
    },
    {
      remote: unsplash("1599100793245-c8ce233a98c3"),
      alt: "Медовий торт у розрізі",
    },
    {
      remote: unsplash("1605801976272-634314a1a2e9"),
      alt: "Коржі з кремом на тарілці",
    },
    {
      remote: unsplash("1682596044370-b2b1dc91cf2b"),
      alt: "Готовий торт із медових коржів",
    },
  ],
  "medovi-korzhi-shokoladni": [
    {
      remote: unsplash("1724331504542-256c1b981d87"),
      alt: "Шоколадно-медові коржі",
    },
    {
      remote: unsplash("1624993014250-fc6877db3222"),
      alt: "Шоколадний торт у розрізі",
    },
  ],
  "biskvitni-korzhi-vanilni": [
    {
      remote: unsplash("1741429385363-82824923d3b0"),
      alt: "Пишні ванільні бісквітні коржі",
    },
  ],
  "korzhi-napoleon": [
    {
      remote: unsplash("1765100214138-05ccfe25d216"),
      alt: "Хрусткі листкові коржі «Наполеон»",
    },
  ],
};

const HERO_LOCAL = "generated-1790146876113.png";
const ABOUT_REMOTE = unsplash("1521884349539-bb44f66a7a40");

async function uploadRemote(url: string, name: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Download failed (${response.status}): ${url}`);
  const body = Buffer.from(await response.arrayBuffer());
  const blob = await put(name, body, {
    access: "public",
    addRandomSuffix: true,
    contentType: response.headers.get("content-type") ?? "image/jpeg",
  });
  return blob.url;
}

async function uploadLocal(filename: string, name: string): Promise<string> {
  const body = await readFile(`${PENCIL_IMAGES}/${filename}`);
  const blob = await put(name, body, {
    access: "public",
    addRandomSuffix: true,
    contentType: "image/png",
  });
  return blob.url;
}

async function main() {
  let uploaded = 0;

  for (const [slug, url] of Object.entries(CATEGORY_PHOTOS)) {
    const blobUrl = await uploadRemote(url, `categories/${slug}.jpg`);
    await db
      .update(categories)
      .set({ imageUrl: blobUrl })
      .where(eq(categories.slug, slug));
    uploaded += 1;
    console.log(`category ${slug}`);
  }

  for (const [slug, photos] of Object.entries(PRODUCT_PHOTOS)) {
    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
    if (!product) {
      console.warn(`skipped missing product ${slug}`);
      continue;
    }

    await db
      .delete(productImages)
      .where(eq(productImages.productId, product.id));

    for (const [index, photo] of photos.entries()) {
      const name = `products/${slug}-${index + 1}.${photo.local ? "png" : "jpg"}`;
      const blobUrl = photo.local
        ? await uploadLocal(photo.local, name)
        : await uploadRemote(photo.remote as string, name);

      await db.insert(productImages).values({
        productId: product.id,
        url: blobUrl,
        alt: photo.alt,
        sort: index + 1,
      });
      uploaded += 1;
    }
    console.log(`product ${slug}: ${photos.length} photo(s)`);
  }

  const heroUrl = await uploadLocal(HERO_LOCAL, "site/hero.png");
  const aboutUrl = await uploadRemote(ABOUT_REMOTE, "site/about.jpg");
  uploaded += 2;

  await db
    .update(siteSettings)
    .set({ heroImageUrl: heroUrl, aboutImageUrl: aboutUrl })
    .where(eq(siteSettings.id, 1));
  console.log("hero and about photos set");

  console.log(`\nUploaded ${uploaded} files to Blob storage.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
