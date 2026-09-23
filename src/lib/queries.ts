import { and, asc, desc, eq, gte, inArray, min, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import {
  categories,
  orderItems,
  orders,
  pages,
  productImages,
  productSections,
  products,
  productVariants,
  reviews,
  siteSettings,
  trustItems,
} from "@/db/schema";

/**
 * Every read here is cached and tagged. Admin writes call updateTag with the
 * matching tag, so the storefront refreshes on save instead of on a timer —
 * which is also what keeps the Neon compute budget low, since a cached page
 * never wakes the database at all.
 */

export type StorefrontSettings = Awaited<ReturnType<typeof getSettings>>;

export async function getSettings() {
  "use cache";
  cacheLife("max");
  cacheTag("settings");

  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, 1))
    .limit(1);
  return row ?? null;
}

/** Categories for the menu, the tile grid and the footer column. */
export async function getMenuCategories() {
  "use cache";
  cacheLife("max");
  cacheTag("categories", "products");

  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      title: categories.title,
      imageUrl: categories.imageUrl,
      productCount: sql<number>`count(${products.id}) filter (where ${products.isActive})::int`,
    })
    .from(categories)
    .leftJoin(products, eq(products.categoryId, categories.id))
    .where(eq(categories.isActive, true))
    .groupBy(categories.id)
    .orderBy(asc(categories.sort), asc(categories.title));
}

type ProductCardRow = {
  id: number;
  slug: string;
  title: string;
  shortDescription: string | null;
  badge: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  minPriceKop: number | null;
};

/** The card/row shape used by «Популярне» and category listings. */
function productCardSelect() {
  return db
    .select({
      id: products.id,
      slug: products.slug,
      title: products.title,
      shortDescription: products.shortDescription,
      badge: products.badge,
      imageUrl: sql<string | null>`(
        select url from ${productImages}
        where ${productImages.productId} = ${products.id}
        order by ${productImages.sort} limit 1
      )`,
      imageAlt: sql<string | null>`(
        select alt from ${productImages}
        where ${productImages.productId} = ${products.id}
        order by ${productImages.sort} limit 1
      )`,
      minPriceKop: min(productVariants.priceKop),
    })
    .from(products)
    .leftJoin(
      productVariants,
      and(
        eq(productVariants.productId, products.id),
        eq(productVariants.isActive, true),
      ),
    );
}

/**
 * «Популярне»: manually pinned products first, then whatever actually sold over
 * the last 60 days. Ranking by sales alone would leave the section empty on a
 * new shop, and pinning alone ignores what customers really buy.
 */
export async function getPopularProducts(limit = 4): Promise<ProductCardRow[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("products", "orders");

  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const bestSelling = await db
    .select({
      productId: orderItems.productId,
      sold: sql<number>`sum(${orderItems.qty})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(
      and(
        gte(orders.createdAt, since),
        sql`${orderItems.productId} is not null`,
      ),
    )
    .groupBy(orderItems.productId)
    .orderBy(desc(sql`sum(${orderItems.qty})`))
    .limit(limit);

  const soldIds = bestSelling
    .map((row) => row.productId)
    .filter((id): id is number => id !== null);

  const rows = await productCardSelect()
    .where(
      and(
        eq(products.isActive, true),
        soldIds.length > 0
          ? sql`(${products.isFeatured} or ${inArray(products.id, soldIds)})`
          : eq(products.isFeatured, true),
      ),
    )
    .groupBy(products.id)
    .orderBy(desc(products.isFeatured), asc(products.sort))
    .limit(limit);

  return rows;
}

export async function getCategoryBySlug(slug: string) {
  "use cache";
  cacheLife("max");
  cacheTag("categories");

  const [category] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, slug), eq(categories.isActive, true)))
    .limit(1);

  return category ?? null;
}

export async function getCategoryProducts(
  categoryId: number,
): Promise<ProductCardRow[]> {
  "use cache";
  cacheLife("max");
  cacheTag("products");

  return productCardSelect()
    .where(
      and(eq(products.categoryId, categoryId), eq(products.isActive, true)),
    )
    .groupBy(products.id)
    .orderBy(asc(products.sort), asc(products.title));
}

export async function getProductBySlug(slug: string) {
  "use cache";
  cacheLife("max");
  cacheTag("products");

  const [product] = await db
    .select({
      product: products,
      categorySlug: categories.slug,
      categoryTitle: categories.title,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(and(eq(products.slug, slug), eq(products.isActive, true)))
    .limit(1);

  if (!product) return null;

  const [variants, images, sections] = await Promise.all([
    db
      .select()
      .from(productVariants)
      .where(
        and(
          eq(productVariants.productId, product.product.id),
          eq(productVariants.isActive, true),
        ),
      )
      .orderBy(asc(productVariants.sort)),
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.product.id))
      .orderBy(asc(productImages.sort)),
    db
      .select()
      .from(productSections)
      .where(eq(productSections.productId, product.product.id))
      .orderBy(asc(productSections.sort)),
  ]);

  return { ...product, variants, images, sections };
}

export async function getAllProductSlugs() {
  "use cache";
  cacheLife("max");
  cacheTag("products");

  return db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.isActive, true));
}

export async function getReviews() {
  "use cache";
  cacheLife("max");
  cacheTag("reviews");

  return db.select().from(reviews).orderBy(asc(reviews.sort), asc(reviews.id));
}

export async function getTrustItems(scope: "main" | "category") {
  "use cache";
  cacheLife("max");
  cacheTag("trust");

  return db
    .select()
    .from(trustItems)
    .where(eq(trustItems.scope, scope))
    .orderBy(asc(trustItems.sort), asc(trustItems.id));
}

export async function getPageBySlug(slug: string) {
  "use cache";
  cacheLife("max");
  cacheTag("pages");

  const [page] = await db
    .select()
    .from(pages)
    .where(eq(pages.slug, slug))
    .limit(1);
  return page ?? null;
}

export async function getAllPageSlugs() {
  "use cache";
  cacheLife("max");
  cacheTag("pages");

  return db.select({ slug: pages.slug }).from(pages);
}

/**
 * The footer copyright year. Reading the clock during a prerender is an error
 * under Cache Components, so it is resolved inside a cached scope that expires
 * daily — accurate enough for a year number, and it never blocks a render.
 */
export async function getCurrentYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

/** Splits a textarea-backed list field into trimmed lines. */
export function toLines(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
