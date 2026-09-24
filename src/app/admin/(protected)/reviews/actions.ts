"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { reviewTextSchema } from "@/lib/admin-schemas";
import { deleteBlobs } from "@/lib/blob";
import { type FormState, num, str, toFieldErrors } from "@/lib/form";
import { assertAdmin } from "@/lib/require-admin";

const schema = reviewTextSchema.extend({
  rating: z.number().int().min(1, "Від 1 до 5").max(5, "Від 1 до 5"),
  sort: z.number().int().min(0).max(9999),
});

export async function saveReview(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await assertAdmin();

  const idRaw = str(formData, "id");
  const id = idRaw ? Number(idRaw) : null;

  const parsed = schema.safeParse({
    author: str(formData, "author"),
    avatarUrl: str(formData, "avatarUrl"),
    rating: num(formData, "rating", 5),
    text: str(formData, "text"),
    sort: num(formData, "sort"),
  });

  if (!parsed.success) return toFieldErrors(parsed.error);

  const values = {
    author: parsed.data.author,
    avatarUrl: parsed.data.avatarUrl || null,
    rating: parsed.data.rating,
    text: parsed.data.text,
    sort: parsed.data.sort,
  };

  const previousAvatarUrl = id
    ? (
        await db
          .select({ avatarUrl: reviews.avatarUrl })
          .from(reviews)
          .where(eq(reviews.id, id))
          .limit(1)
      )[0]?.avatarUrl
    : null;

  if (id) {
    await db.update(reviews).set(values).where(eq(reviews.id, id));
  } else {
    await db.insert(reviews).values(values);
  }

  if (previousAvatarUrl && previousAvatarUrl !== values.avatarUrl) {
    await deleteBlobs([previousAvatarUrl]);
  }

  updateTag("reviews");
  redirect("/admin/reviews");
}

export async function deleteReview(formData: FormData): Promise<void> {
  await assertAdmin();

  const id = Number(str(formData, "id"));
  if (!id) return;

  const [existing] = await db
    .select({ avatarUrl: reviews.avatarUrl })
    .from(reviews)
    .where(eq(reviews.id, id))
    .limit(1);

  await db.delete(reviews).where(eq(reviews.id, id));
  await deleteBlobs([existing?.avatarUrl]);

  updateTag("reviews");
  redirect("/admin/reviews");
}
