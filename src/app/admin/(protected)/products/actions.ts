"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, withTransaction } from "@/db";
import { productSections, products, productVariants } from "@/db/schema";
import {
  bool,
  type FormState,
  isUniqueViolation,
  num,
  str,
  toFieldErrors,
} from "@/lib/form";
import { toKopiyky } from "@/lib/money";
import { assertAdmin } from "@/lib/require-admin";
import { slugify } from "@/lib/slug";

const variantSchema = z.object({
  label: z.string().min(1, "Вкажіть розмір").max(40),
  weightLabel: z.string().max(40).optional(),
  priceKop: z.number().int().positive("Вкажіть ціну"),
  sort: z.number().int(),
});

const sectionSchema = z.object({
  title: z.string().min(1, "Вкажіть заголовок").max(80),
  body: z.string().min(1, "Вкажіть текст"),
  sort: z.number().int(),
});

const schema = z.object({
  title: z.string().min(2, "Вкажіть назву").max(160),
  slug: z
    .string()
    .min(2, "Вкажіть адресу")
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Тільки латиниця, цифри та дефіс"),
  categoryId: z.number().int().positive("Оберіть категорію"),
  shortDescription: z.string().max(240).optional(),
  description: z.string().max(4000).optional(),
  badge: z.string().max(24).optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  sort: z.number().int().min(0).max(9999),
  seoTitle: z.string().max(180).optional(),
  seoDescription: z.string().max(320).optional(),
  variants: z.array(variantSchema).min(1, "Додайте хоча б один розмір"),
  sections: z.array(sectionSchema),
});

/**
 * Variants and sections arrive as indexed form fields (variant.0.label, …).
 * Rows the admin removed in the browser simply aren't submitted, so gaps in the
 * indexes are expected and the order is taken from the field order, not the index.
 */
function collectRows(formData: FormData, prefix: string, fields: string[]) {
  const byIndex = new Map<string, Record<string, string>>();

  for (const [key, value] of formData.entries()) {
    const match = key.match(new RegExp(`^${prefix}\\.(\\d+)\\.(\\w+)$`));
    if (!match) continue;
    const [, index, field] = match;
    if (!fields.includes(field)) continue;
    const row = byIndex.get(index) ?? {};
    row[field] = String(value).trim();
    byIndex.set(index, row);
  }

  return [...byIndex.entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([, row]) => row);
}

export async function saveProduct(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await assertAdmin();

  const idRaw = str(formData, "id");
  const id = idRaw ? Number(idRaw) : null;
  const title = str(formData, "title");

  const variantRows = collectRows(formData, "variant", [
    "label",
    "weightLabel",
    "price",
  ]).filter((row) => row.label || row.price);

  // Reject bad prices before Zod, so the message names the row.
  const variants: z.input<typeof variantSchema>[] = [];
  for (const [index, row] of variantRows.entries()) {
    const priceKop = toKopiyky(row.price ?? "");
    if (priceKop === null) {
      return { fieldErrors: { [`variant.${index}.price`]: "Некоректна ціна" } };
    }
    variants.push({
      label: row.label ?? "",
      weightLabel: row.weightLabel ?? "",
      priceKop,
      sort: index + 1,
    });
  }

  const sections = collectRows(formData, "section", ["title", "body"])
    .filter((row) => row.title || row.body)
    .map((row, index) => ({
      title: row.title ?? "",
      body: row.body ?? "",
      sort: index + 1,
    }));

  const parsed = schema.safeParse({
    title,
    slug: str(formData, "slug") || slugify(title),
    categoryId: num(formData, "categoryId"),
    shortDescription: str(formData, "shortDescription"),
    description: str(formData, "description"),
    badge: str(formData, "badge"),
    isActive: bool(formData, "isActive"),
    isFeatured: bool(formData, "isFeatured"),
    sort: num(formData, "sort"),
    seoTitle: str(formData, "seoTitle"),
    seoDescription: str(formData, "seoDescription"),
    variants,
    sections,
  });

  if (!parsed.success) {
    const state = toFieldErrors(parsed.error);
    // A missing variant list has no field of its own to attach to.
    if (state.fieldErrors?.variants) {
      return {
        error: state.fieldErrors.variants,
        fieldErrors: state.fieldErrors,
      };
    }
    return state;
  }

  const data = parsed.data;
  const values = {
    title: data.title,
    slug: data.slug,
    categoryId: data.categoryId,
    shortDescription: data.shortDescription || null,
    description: data.description || null,
    badge: data.badge || null,
    isActive: data.isActive,
    isFeatured: data.isFeatured,
    sort: data.sort,
    seoTitle: data.seoTitle || null,
    seoDescription: data.seoDescription || null,
    updatedAt: new Date(),
  };

  try {
    await withTransaction(async (tx) => {
      let productId = id;

      if (productId) {
        await tx.update(products).set(values).where(eq(products.id, productId));
        // Replacing rather than diffing: the lists are short, and a partial
        // failure would leave a product with mismatched sizes.
        await tx
          .delete(productVariants)
          .where(eq(productVariants.productId, productId));
        await tx
          .delete(productSections)
          .where(eq(productSections.productId, productId));
      } else {
        const [inserted] = await tx
          .insert(products)
          .values(values)
          .returning({ id: products.id });
        productId = inserted.id;
      }

      await tx.insert(productVariants).values(
        data.variants.map((variant) => ({
          productId,
          label: variant.label,
          weightLabel: variant.weightLabel || null,
          priceKop: variant.priceKop,
          sort: variant.sort,
        })),
      );

      if (data.sections.length > 0) {
        await tx.insert(productSections).values(
          data.sections.map((section) => ({
            productId,
            title: section.title,
            body: section.body,
            sort: section.sort,
          })),
        );
      }
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { fieldErrors: { slug: "Така адреса вже зайнята" } };
    }
    throw error;
  }

  updateTag("products");
  redirect("/admin/products");
}

export async function deleteProduct(formData: FormData): Promise<void> {
  await assertAdmin();

  const id = Number(str(formData, "id"));
  if (!id) return;

  // Variants and sections cascade; order_items keep their snapshots and null out.
  await db.delete(products).where(eq(products.id, id));

  updateTag("products");
  redirect("/admin/products");
}
