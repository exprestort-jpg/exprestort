"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { pages } from "@/db/schema";
import {
  type FormState,
  isUniqueViolation,
  str,
  toFieldErrors,
} from "@/lib/form";
import { assertAdmin } from "@/lib/require-admin";
import { sanitizePageHtml } from "@/lib/sanitize";
import { slugify } from "@/lib/slug";

const schema = z.object({
  title: z.string().min(2, "Вкажіть заголовок").max(160),
  slug: z
    .string()
    .min(2, "Вкажіть адресу")
    .max(64)
    .regex(/^[a-z0-9-]+$/, "Тільки латиниця, цифри та дефіс"),
  body: z.string().max(80_000),
  seoTitle: z.string().max(180).optional(),
  seoDescription: z.string().max(320).optional(),
});

export async function savePage(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await assertAdmin();

  const idRaw = str(formData, "id");
  const id = idRaw ? Number(idRaw) : null;
  const title = str(formData, "title");

  const parsed = schema.safeParse({
    title,
    slug: str(formData, "slug") || slugify(title),
    body: str(formData, "body"),
    seoTitle: str(formData, "seoTitle"),
    seoDescription: str(formData, "seoDescription"),
  });

  if (!parsed.success) return toFieldErrors(parsed.error);

  const values = {
    title: parsed.data.title,
    slug: parsed.data.slug,
    body: sanitizePageHtml(parsed.data.body),
    seoTitle: parsed.data.seoTitle || null,
    seoDescription: parsed.data.seoDescription || null,
    updatedAt: new Date(),
  };

  try {
    if (id) {
      await db.update(pages).set(values).where(eq(pages.id, id));
    } else {
      await db.insert(pages).values(values);
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { fieldErrors: { slug: "Така адреса вже зайнята" } };
    }
    throw error;
  }

  updateTag("pages");
  redirect("/admin/pages");
}

export async function deletePage(formData: FormData): Promise<void> {
  await assertAdmin();

  const id = Number(str(formData, "id"));
  if (!id) return;

  await db.delete(pages).where(eq(pages.id, id));

  updateTag("pages");
  redirect("/admin/pages");
}
