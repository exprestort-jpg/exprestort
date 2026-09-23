import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import {
  categories,
  productImages,
  productSections,
  products,
  productVariants,
} from "@/db/schema";
import { toHryvnia } from "@/lib/money";
import { requireAdmin } from "@/lib/require-admin";
import styles from "../../_components/admin.module.css";
import { ProductForm } from "../product-form";

export const instant = false;

export default async function EditProductPage({
  params,
}: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const productId = Number(id);

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  if (!product) notFound();

  const [variants, sections, images, categoryOptions] = await Promise.all([
    db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId))
      .orderBy(asc(productVariants.sort)),
    db
      .select()
      .from(productSections)
      .where(eq(productSections.productId, productId))
      .orderBy(asc(productSections.sort)),
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(asc(productImages.sort)),
    db
      .select({ id: categories.id, title: categories.title })
      .from(categories)
      .orderBy(asc(categories.sort)),
  ]);

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>{product.title}</h1>
      </header>
      <ProductForm
        categories={categoryOptions}
        values={{
          id: product.id,
          title: product.title,
          slug: product.slug,
          categoryId: product.categoryId,
          shortDescription: product.shortDescription ?? "",
          description: product.description ?? "",
          badge: product.badge ?? "",
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          sort: product.sort,
          seoTitle: product.seoTitle ?? "",
          seoDescription: product.seoDescription ?? "",
          variants: variants.map((variant) => ({
            label: variant.label,
            weightLabel: variant.weightLabel ?? "",
            price: toHryvnia(variant.priceKop),
          })),
          sections: sections.map((section) => ({
            title: section.title,
            body: section.body,
          })),
          images: images.map((image) => ({
            url: image.url,
            alt: image.alt ?? "",
          })),
        }}
      />
    </>
  );
}
