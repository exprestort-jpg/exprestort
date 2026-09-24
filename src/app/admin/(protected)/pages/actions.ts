"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { pageTextSchema } from "@/lib/admin-schemas";
import {
  type FormState,
  isUniqueViolation,
  str,
  toFieldErrors,
} from "@/lib/form";
import { assertAdmin } from "@/lib/require-admin";
import { sanitizePageHtml } from "@/lib/sanitize";
import { slugify } from "@/lib/slug";

const schema = pageTextSchema;

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

  let savedId = id;
  try {
    if (savedId) {
      await db.update(pages).set(values).where(eq(pages.id, savedId));
    } else {
      const [inserted] = await db
        .insert(pages)
        .values(values)
        .returning({ id: pages.id });
      savedId = inserted.id;
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { fieldErrors: { slug: "Така адреса вже зайнята" } };
    }
    throw error;
  }

  updateTag("pages");
  // No redirect — the admin stays on the form and sees a confirmation instead.
  return { saved: true, savedId };
}

export async function deletePage(formData: FormData): Promise<void> {
  await assertAdmin();

  const id = Number(str(formData, "id"));
  if (!id) return;

  await db.delete(pages).where(eq(pages.id, id));

  updateTag("pages");
  redirect("/admin/pages");
}
