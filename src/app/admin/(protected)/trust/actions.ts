"use server";

import { eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { trustItems } from "@/db/schema";
import { trustTextSchema } from "@/lib/admin-schemas";
import { type FormState, num, str, toFieldErrors } from "@/lib/form";
import { assertAdmin } from "@/lib/require-admin";

const schema = trustTextSchema.extend({
  sort: z.number().int().min(0).max(9999),
});

export async function saveTrustItem(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await assertAdmin();

  const idRaw = str(formData, "id");
  const id = idRaw ? Number(idRaw) : null;

  const parsed = schema.safeParse({
    icon: str(formData, "icon"),
    label: str(formData, "label"),
    scope: str(formData, "scope"),
    sort: num(formData, "sort"),
  });

  if (!parsed.success) return toFieldErrors(parsed.error);

  const values = {
    icon: parsed.data.icon,
    label: parsed.data.label,
    scope: parsed.data.scope,
    sort: parsed.data.sort,
  };

  if (id) {
    await db.update(trustItems).set(values).where(eq(trustItems.id, id));
  } else {
    await db.insert(trustItems).values(values);
  }

  updateTag("trust");
  redirect("/admin/trust");
}

export async function deleteTrustItem(formData: FormData): Promise<void> {
  await assertAdmin();

  const id = Number(str(formData, "id"));
  if (!id) return;

  await db.delete(trustItems).where(eq(trustItems.id, id));

  updateTag("trust");
  redirect("/admin/trust");
}
