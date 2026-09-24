import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/queries";
import { siteUrl } from "@/lib/site";

/**
 * Only indexable storefront URLs belong here. Cart, checkout and search are
 * per-visitor or infinite, so they stay out of the sitemap and are disallowed
 * in robots.ts instead.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories, pages } = await getSitemapEntries();

  return [
    {
      url: siteUrl("/"),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: siteUrl("/catalog"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: siteUrl("/products"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...categories.map((category) => ({
      url: siteUrl(`/catalog/${category.slug}`),
      lastModified: category.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: siteUrl(`/product/${product.slug}`),
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...pages.map((page) => ({
      url: siteUrl(`/${page.slug}`),
      lastModified: page.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];
}
