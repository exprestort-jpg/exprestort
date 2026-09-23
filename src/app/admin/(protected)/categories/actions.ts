"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { deleteBlobs } from "@/lib/blob";
import {
  bool,
  type FormState,
  isForeignKeyViolation,
  isUniqueViolation,
  num,
  str,
  toFieldErrors,
} from "@/lib/form";
import { assertAdmin } from "@/lib/require-admin";
import { slugify } from "@/lib/slug";

const schema = z.object({
  title: z.string().min(2, "Вкажіть назву").max(120, "Назва задовга"),
  slug: z
    .string()
    .min(2, "Вкажіть адресу")
    .max(64, "Адреса задовга")
    .regex(/^[a-z0-9-]+$/, "Тільки латиниця, цифри та дефіс"),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url("Некоректне посилання").or(z.literal("")).optional(),
  sort: z.number().int().min(0).max(9999),
  isActive: z.boolean(),
  seoTitle: z.string().max(180).optional(),
  seoDescription: z.string().max(320).optional(),
});

export async function saveCategory(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await assertAdmin();

  const idRaw = str(formData, "id");
  const id = idRaw ? Number(idRaw) : null;
  const title = str(formData, "title");

  const parsed = schema.safeParse({
    title,
    // An empty slug field means "derive it from the title".
    slug: str(formData, "slug") || slugify(title),
    description: str(formData, "description"),
    imageUrl: str(formData, "imageUrl"),
    sort: num(formData, "sort"),
    isActive: bool(formData, "isActive"),
    seoTitle: str(formData, "seoTitle"),
    seoDescription: str(formData, "seoDescription"),
  });

  if (!parsed.success) return toFieldErrors(parsed.error);

  const values = {
    title: parsed.data.title,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
    imageUrl: parsed.data.imageUrl || null,
    sort: parsed.data.sort,
    isActive: parsed.data.isActive,
    seoTitle: parsed.data.seoTitle || null,
    seoDescription: parsed.data.seoDescription || null,
    updatedAt: new Date(),
  };

  // Kept so a replaced photo can be removed from Blob storage afterwards.
  const previousImageUrl = id
    ? (
        await db
          .select({ imageUrl: categories.imageUrl })
          .from(categories)
          .where(eq(categories.id, id))
          .limit(1)
      )[0]?.imageUrl
    : null;

  try {
    if (id) {
      await db.update(categories).set(values).where(eq(categories.id, id));
    } else {
      await db.insert(categories).values(values);
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { fieldErrors: { slug: "Така адреса вже зайнята" } };
    }
    throw error;
  }

  if (previousImageUrl && previousImageUrl !== values.imageUrl) {
    await deleteBlobs([previousImageUrl]);
  }

  // updateTag so the admin sees its own write immediately; the storefront picks
  // the change up through the same tag.
  updateTag("categories");
  redirect("/admin/categories");
}

export async function deleteCategory(formData: FormData): Promise<void> {
  await assertAdmin();

  const id = Number(str(formData, "id"));
  if (!id) return;

  const [existing] = await db
    .select({ imageUrl: categories.imageUrl })
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);

  try {
    await db.delete(categories).where(eq(categories.id, id));
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      redirect("/admin/categories?error=has-products");
    }
    throw error;
  }

  await deleteBlobs([existing?.imageUrl]);

  updateTag("categories");
  redirect("/admin/categories");
}
